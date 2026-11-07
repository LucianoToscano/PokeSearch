package com.lucianotoscano.pokesearchoverlay;

import androidx.annotation.NonNull;
import androidx.room.Entity;
import androidx.room.PrimaryKey;

/**
 * Um evento imutável na sessão real do assistente, separado do Modo Treino.
 * O estado é reconstruído reproduzindo os eventos em ordem de inserção.
 */
@Entity(tableName="raid_day_events")
public class RaidDayEvent {
    @PrimaryKey(autoGenerate=true)
    public long id;
    @NonNull public String sessionKey="";
    @NonNull public String type="";
    @NonNull public String stepId="";
    @NonNull public String source="USER";
    @NonNull public String evidence="USER_ATTESTED";
    public long occurredAtMs;
    public int nextIndex;
    public int cycleCount;
    public boolean paused;
    public boolean finished;
    public boolean active;

    public RaidDayEvent(){}
}
