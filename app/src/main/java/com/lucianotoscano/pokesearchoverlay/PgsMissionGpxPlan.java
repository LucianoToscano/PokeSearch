package com.lucianotoscano.pokesearchoverlay;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import javax.xml.XMLConstants;
import javax.xml.parsers.DocumentBuilderFactory;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;

/**
 * LT408: leitura LOCAL de GPX para pesquisas de campo.
 * NÃO contém teleporte, ações no jogo, horários, nem recompensas verificadas.
 * As trincas são apenas agrupamentos candidatos, nunca prova de missões.
 */
final class PgsMissionGpxPlan {
    static final int MAX_FILE_BYTES = 1024 * 1024;
    static final int MAX_WAYPOINTS = 3000;
    static final int CANDIDATE_GROUP_SIZE = 3;
    static final int THEORETICAL_CANDIES_PER_TASK = 25;

    static final class Stop {
        final int ordinal;
        final String name;
        final double latitude;
        final double longitude;
        Stop(int ordinal, String name, double latitude, double longitude) {
            this.ordinal = ordinal;
            this.name = name;
            this.latitude = latitude;
            this.longitude = longitude;
        }
        String coordinates() {
            return String.format(Locale.US, "%.6f, %.6f", latitude, longitude);
        }
    }

    final List<Stop> stops;
    final int repeatedCoordinates;
    private PgsMissionGpxPlan(List<Stop> stops, int repeatedCoordinates) {
        this.stops = Collections.unmodifiableList(new ArrayList<>(stops));
        this.repeatedCoordinates = repeatedCoordinates;
    }

    int fullGroups() { return stops.size() / CANDIDATE_GROUP_SIZE; }
    int leftoverStops() { return stops.size() % CANDIDATE_GROUP_SIZE; }
    int possibleCandiesIfAllVerified() {
        return fullGroups() * CANDIDATE_GROUP_SIZE * THEORETICAL_CANDIES_PER_TASK;
    }

    static byte[] readLimited(InputStream input) throws IOException {
        if (input == null) throw new IOException("Arquivo GPX indisponível");
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        byte[] buf = new byte[8192];
        int n;
        while ((n = input.read(buf)) != -1) {
            if (out.size() + n > MAX_FILE_BYTES)
                throw new IOException("GPX maior que 1 MB");
            out.write(buf, 0, n);
        }
        return out.toByteArray();
    }

    static PgsMissionGpxPlan parse(InputStream input) throws Exception {
        return parse(readLimited(input));
    }

    static PgsMissionGpxPlan parse(byte[] xml) throws Exception {
        if (xml == null || xml.length == 0 || xml.length > MAX_FILE_BYTES)
            throw new IOException("Tamanho de GPX inválido");
        DocumentBuilderFactory f = DocumentBuilderFactory.newInstance();
        f.setNamespaceAware(true);
        f.setXIncludeAware(false);
        f.setExpandEntityReferences(false);
        f.setFeature(XMLConstants.FEATURE_SECURE_PROCESSING, true);
        f.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
        f.setFeature("http://xml.org/sax/features/external-general-entities", false);
        f.setFeature("http://xml.org/sax/features/external-parameter-entities", false);
        f.setFeature("http://apache.org/xml/features/nonvalidating/load-external-dtd", false);
        Document doc = f.newDocumentBuilder().parse(new ByteArrayInputStream(xml));
        Element root = doc.getDocumentElement();
        if (root == null || !"gpx".equals(local(root)))
            throw new IOException("O arquivo não contém uma raiz GPX válida");

        NodeList points = descendants(root, "wpt");
        if (points.getLength() == 0) points = descendants(root, "rtept");
        if (points.getLength() == 0) points = descendants(root, "trkpt");
        if (points.getLength() == 0)
            throw new IOException("GPX sem coordenadas wpt, rtept ou trkpt");
        if (points.getLength() > MAX_WAYPOINTS)
            throw new IOException("GPX ultrapassa 3.000 coordenadas");

        ArrayList<Stop> result = new ArrayList<>(points.getLength());
        Set<String> seen = new HashSet<>();
        int duplicates = 0;
        for (int i = 0; i < points.getLength(); i++) {
            Element p = (Element) points.item(i);
            double lat, lon;
            try {
                lat = Double.parseDouble(p.getAttribute("lat"));
                lon = Double.parseDouble(p.getAttribute("lon"));
            } catch (NumberFormatException ex) {
                throw new IOException("Latitude/longitude inválida no ponto " + (i + 1));
            }
            if (!Double.isFinite(lat) || !Double.isFinite(lon) ||
                    lat < -90 || lat > 90 || lon < -180 || lon > 180)
                throw new IOException("Coordenada fora do intervalo no ponto " + (i + 1));
            String name = "";
            NodeList names = descendants(p, "name");
            if (names.getLength() > 0 && names.item(0).getTextContent() != null)
                name = names.item(0).getTextContent().trim();
            if (name.isEmpty()) name = String.valueOf(i + 1);
            if (name.length() > 80) name = name.substring(0, 80);
            Stop stop = new Stop(i + 1, name, lat, lon);
            if (!seen.add(stop.coordinates())) duplicates++;
            result.add(stop);
        }
        return new PgsMissionGpxPlan(result, duplicates);
    }

    private static String local(Node n) {
        String s = n.getLocalName();
        if (s != null) return s;
        s = n.getNodeName();
        int colon = s.indexOf(':');
        return colon < 0 ? s : s.substring(colon + 1);
    }

    private static NodeList descendants(Element root, String tag) {
        return root.getElementsByTagNameNS("*", tag);
    }
}
