package com.lucianotoscano.pokesearchoverlay;

import androidx.room.Dao;
import androidx.room.Insert;
import androidx.room.Query;
import java.util.List;

@Dao
public interface RaidDayEventDao {
    @Insert long add(RaidDayEvent event);
    @Query("SELECT * FROM raid_day_events WHERE sessionKey=:session ORDER BY id ASC")
    List<RaidDayEvent> all(String session);
    @Query("SELECT COUNT(*) FROM raid_day_events WHERE sessionKey=:session")
    int count(String session);
}
