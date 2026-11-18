package com.lucianotoscano.pokesearchoverlay;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;

public final class PgsMissionGpxPlanTest {
    private static void ok(boolean condition, String label) {
        if (!condition) throw new AssertionError(label);
    }
    private static byte[] bytes(String value) {
        return value.getBytes(StandardCharsets.UTF_8);
    }
    private static void mustReject(String xml, String reason) {
        boolean rejected = false;
        try {
            PgsMissionGpxPlan.parse(bytes(xml));
        } catch (Exception expected) {
            rejected = true;
        }
        ok(rejected, reason);
    }
    public static void main(String[] args) throws Exception {
        StringBuilder builder = new StringBuilder("<gpx version=\"1.1\">");
        for (int i = 1; i <= 500; i++)
            builder.append("<wpt lat=\"40.").append(500000 + i)
                .append("\" lon=\"-73.").append(500000 + i)
                .append("\"><name>").append(i).append("</name></wpt>");
        builder.append("</gpx>");
        PgsMissionGpxPlan p = PgsMissionGpxPlan.parse(bytes(builder.toString()));
        ok(p.stops.size() == 500, "500 waypoints preserved");
        ok(p.fullGroups() == 166, "166 complete candidate trios");
        ok(p.leftoverStops() == 2, "two leftover stops");
        ok(p.possibleCandiesIfAllVerified() == 12450, "hypothetical projection");
        ok("1".equals(p.stops.get(0).name), "name from GPX");
        ok(p.stops.get(0).coordinates().startsWith("40."), "coordinates format");
        ok(p.repeatedCoordinates == 0, "no duplicate input");
        ok(p.cumulativeDistanceKm > 0 && p.cumulativeDistanceKm < 10,
            "ordered synthetic route distance computed");
        ok(p.longestHopKm > 0 && p.longestHopKm < 1,
            "small synthetic max hop computed");
        boolean immutable = false;
        try { p.stops.clear(); } catch (UnsupportedOperationException expected) {
            immutable = true;
        }
        ok(immutable, "immutable stop list");

        PgsMissionGpxPlan route = PgsMissionGpxPlan.parse(bytes(
            "<gpx xmlns=\"http://www.topografix.com/GPX/1/1\"><rte>"
            + "<rtept lat=\"1\" lon=\"2\"/><rtept lat=\"3\" lon=\"4\"/>"
            + "</rte></gpx>"));
        ok(route.stops.size() == 2, "namespaced rtept support");
        ok("1".equals(route.stops.get(0).name), "missing name fallback");
        PgsMissionGpxPlan track = PgsMissionGpxPlan.parse(bytes(
            "<gpx><trk><trkseg><trkpt lat=\"0\" lon=\"0\"/>"
            + "</trkseg></trk></gpx>"));
        ok(track.stops.size() == 1, "trkpt support");
        PgsMissionGpxPlan measured = PgsMissionGpxPlan.parse(bytes(
            "<gpx><wpt lat=\"0\" lon=\"0\"/><wpt lat=\"1\" lon=\"0\"/>"
            + "<wpt lat=\"2\" lon=\"0\"/></gpx>"));
        ok(Math.abs(measured.cumulativeDistanceKm - 222.39) < 0.3,
            "two degree latitude haversine distance");
        ok(Math.abs(measured.longestHopKm - 111.20) < 0.3,
            "one degree latitude largest hop");
        PgsMissionGpxPlan emptyJump = PgsMissionGpxPlan.parse(bytes(
            "<gpx><wpt lat=\"0\" lon=\"0\"/></gpx>"));
        ok(emptyJump.cumulativeDistanceKm == 0.0,
            "singleton GPX has zero route distance");

        PgsMissionGpxPlan duplicates = PgsMissionGpxPlan.parse(bytes(
            "<gpx><wpt lat=\"2\" lon=\"3\"/><wpt lat=\"2\" lon=\"3\"/></gpx>"));
        ok(duplicates.repeatedCoordinates == 1, "duplicate flagged, not discarded");

        mustReject("<html><wpt lat=\"1\" lon=\"2\"/></html>", "wrong root");
        mustReject("<gpx></gpx>", "empty route");
        mustReject("<gpx><wpt lat=\"91\" lon=\"2\"/></gpx>", "invalid latitude");
        mustReject("<gpx><wpt lat=\"1\" lon=\"-181\"/></gpx>", "invalid longitude");
        mustReject("<gpx><wpt lat=\"NaN\" lon=\"2\"/></gpx>", "nonfinite");
        mustReject("<!DOCTYPE gpx [<!ENTITY exploit SYSTEM \"file:///etc/passwd\">]>"
            + "<gpx><wpt lat=\"1\" lon=\"2\"><name>&exploit;</name></wpt></gpx>",
            "XXE/DOCTYPE denied");
        boolean sizeRejected = false;
        try {
            byte[] huge = new byte[PgsMissionGpxPlan.MAX_FILE_BYTES + 1];
            PgsMissionGpxPlan.readLimited(new ByteArrayInputStream(huge));
        } catch (IOException expected) { sizeRejected = true; }
        ok(sizeRejected, "bounded upload");
        System.out.println("LT408 GPX waypoint parsing, safety, 500-point grouping PASS");
    }
}
