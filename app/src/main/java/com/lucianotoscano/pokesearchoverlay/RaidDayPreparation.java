package com.lucianotoscano.pokesearchoverlay;

import android.content.SharedPreferences;
import android.content.Context;
import java.time.Clock;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

/**
 * Assistente de preparação: sete perguntas em diálogo; nenhuma escolha de local de partida.
 * Informações são declarações do jogador; nunca uma leitura do servidor.
 */
public final class RaidDayPreparation {
    public static final int COUNT=7;
    private static final String KEY="raid_day_prep_v2_";
    private static final DateTimeFormatter BR_DATE=
        DateTimeFormatter.ofPattern("dd/MM/yyyy",Locale.forLanguageTag("pt-BR"));

    private final String[] questions;
    private final String[][] options;
    private final String[] answers=new String[COUNT];
    private boolean complete;
    private int questionIndex;

    private RaidDayPreparation(Context context){
        questions=context.getResources().getStringArray(
            R.array.raid_day_preparation_questions);
        String[] tri=context.getResources().getStringArray(
            R.array.raid_day_preparation_yes_no);
        String[] modes=context.getResources().getStringArray(
            R.array.raid_day_preparation_modes);
        if(questions.length!=COUNT||tri.length!=3||modes.length!=2)throw new IllegalStateException("Preparação inválida");
        options=new String[][]{
            {},tri,tri,tri,tri,tri,modes
        };
    }
    public static RaidDayPreparation load(Context context,
        SharedPreferences prefs,Clock clock){
        RaidDayPreparation prep=new RaidDayPreparation(context);
        // Migra perguntas da LT304 anterior sem descartar passes e restrições.
        if(!prefs.getBoolean("raid_day_prep_v3_migrated",false)){
            int[] oldIndexes={0,2,3,4,5,6,7};
            SharedPreferences.Editor migrate=prefs.edit();
            String[] old=new String[COUNT];
            for(int i=0;i<COUNT;i++)old[i]=prefs.getString(KEY+"answer_"+oldIndexes[i],"");
            for(int i=0;i<COUNT;i++)migrate.putString(KEY+"answer_"+i,old[i]);
            migrate.putBoolean(KEY+"completed",false)
                .putInt(KEY+"question",0)
                .putBoolean("raid_day_prep_v3_migrated",true).apply();
        }
        for(int i=0;i<COUNT;i++)prep.answers[i]=prefs.getString(KEY+"answer_"+i,"");
        if(prep.answers[0].isEmpty())
            prep.answers[0]=RaidDayEventClock.todayBrasilia(clock)
                .plusDays(1).toString();
        try{LocalDate.parse(prep.answers[0]);}
        catch(Exception invalid){
            prep.answers[0]=RaidDayEventClock.todayBrasilia(clock)
                .plusDays(1).toString();
        }
        for(int i=1;i<COUNT;i++){
            boolean known=false;
            for(String option:prep.options[i])
                if(option.equals(prep.answers[i]))known=true;
            if(!known)prep.answers[i]="";
        }
        prep.complete=prefs.getBoolean(KEY+"completed",false)&&prep.allAnswered();
        prep.questionIndex=Math.max(0,Math.min(COUNT-1,
            prefs.getInt(KEY+"question",0)));
        return prep;
    }
    public String questionText(int q){return questions[q];}
    public String[] optionsFor(int q){return options[q];}
    public boolean isComplete(){return complete&&allAnswered();}
    public int question(){return questionIndex;}
    public void setQuestion(int q){questionIndex=Math.max(0,Math.min(COUNT-1,q));}
    public String answer(int q){return answers[q];}
    public void choose(String selected){
        if(questionIndex==0)throw new IllegalStateException("Data usa ajuste por dias");
        for(String option:options[questionIndex]){
            if(option.equals(selected)){answers[questionIndex]=selected;return;}
        }
        throw new IllegalArgumentException("Opção não reconhecida");
    }
    public void shiftDate(int deltaDays,Clock clock){
        LocalDate current=eventDate();
        if(current==null)current=RaidDayEventClock.todayBrasilia(clock).plusDays(1);
        LocalDate chosen=current.plusDays(deltaDays);
        LocalDate minimum=RaidDayEventClock.todayBrasilia(clock).minusDays(1);
        LocalDate maximum=minimum.plusYears(3);
        if(chosen.isBefore(minimum))chosen=minimum;
        if(chosen.isAfter(maximum))chosen=maximum;
        answers[0]=chosen.toString();
    }
    public LocalDate eventDate(){
        try{return LocalDate.parse(answers[0]);}
        catch(Exception ignored){return null;}
    }
    public String displayDate(){
        LocalDate date=eventDate();
        return date==null?"Data não informada":BR_DATE.format(date);
    }
    public boolean allAnswered(){
        for(String x:answers)if(x==null||x.isEmpty())return false;
        return eventDate()!=null;
    }
    public boolean currentAnswered(){
        return answers[questionIndex]!=null&&!answers[questionIndex].isEmpty();
    }
    public void markComplete(){complete=allAnswered();}
    public void beginEditing(){complete=false;questionIndex=0;}
    public String eventKey(){
        // Não contém GPS real ou outro dado privado do jogador.
        return "manual:"+answers[0];
    }
    public String summary(){
        return "Dia: "+displayDate()+" (informado, não verificado)"+
            "\nPasse anterior: "+answers[1]+" | Passe de hoje: "+answers[2]+
            "\nReide hoje: "+answers[3]+" | Já começou: "+answers[4]+
            "\nRestrição: "+answers[5]+" | Modo: "+answers[6];
    }
    public void save(SharedPreferences prefs){
        SharedPreferences.Editor e=prefs.edit();
        for(int i=0;i<COUNT;i++)e.putString(KEY+"answer_"+i,answers[i]);
        e.putBoolean(KEY+"completed",isComplete());
        e.putInt(KEY+"question",questionIndex);
        e.apply();
    }
}
