package com.lucianotoscano.pokesearchoverlay;

import android.content.Context;
import androidx.room.Database;
import androidx.room.Room;
import androidx.room.RoomDatabase;

/**
 * Banco privado para o caderno de eventos. Não contém frames, cookies,
 * localização real nem dados do servidor do jogo.
 */
@Database(entities={RaidDayEvent.class},version=1,exportSchema=false)
public abstract class RaidDayDatabase extends RoomDatabase {
    public abstract RaidDayEventDao events();
    private static volatile RaidDayDatabase singleton;
    public static RaidDayDatabase get(Context context){
        if(singleton==null){
            synchronized(RaidDayDatabase.class){
                if(singleton==null){
                    singleton=Room.databaseBuilder(context.getApplicationContext(),
                        RaidDayDatabase.class,"pokesearch_raid_day_history.db")
                        // Ações humanas são raras e o log pequeno; escrever no
                        // clique garante persistência ANTES de avançar a UI.
                        // Uma fase futura poderá usar Room assíncrono.
                        .allowMainThreadQueries().build();
                }
            }
        }
        return singleton;
    }
}
