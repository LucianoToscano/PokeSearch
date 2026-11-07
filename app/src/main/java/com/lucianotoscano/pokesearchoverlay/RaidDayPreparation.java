package com.lucianotoscano.pokesearchoverlay;

import android.content.SharedPreferences;
import java.time.Clock;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

/**
 * Assistente de preparação: 8 perguntas simples, uma por vez.
 * Informações são declarações do jogador; nunca uma leitura do servidor.
 */
public final class RaidDayPreparation {
    public static final int COUNT=8;
    private static final String KEY="raid_day_prep_v2_";
    private static final DateTimeFormatter BR_DATE=
        DateTimeFormatter.ofPattern("dd/MM/yyyy",Locale.forLanguageTag("pt-BR"));

    public static final String[] QUESTIONS={
        "Qual é o Dia de Reides?",
        "Onde você pretende jogar no dia do evento?",
        "Possui Passe Diário guardado do dia anterior?",
        "Já coletou o Passe Diário de hoje?",
        "Já realizou alguma reide hoje?",
        "Já começou o roteiro ou esteve em outra região?",
        "Existe algum aviso ou restrição ativa na sua conta?",
        "Como deseja acompanhar o roteiro?"
    };
    public static final String[][] OPTIONS={
        {}, // Data selecionada por botões, nunca inferida como oficial
        {"Central Park","Parque Ibirapuera","Pier 39","Honolulu","Outro local"},
        {"Sim","Não","Não sei"},
        {"Sim","Não","Não sei"},
        {"Sim","Não","Não sei"},
        {"Sim","Não","Não sei"},
        {"Sim","Não","Não sei"},
        {"Manual","Híbrido (planejado)"}
    };

    private final String[] answers=new String[COUNT];
    private boolean complete;
    private int questionIndex;

    private RaidDayPreparation(){}
    public static RaidDayPreparation load(SharedPreferences prefs,Clock clock){
        RaidDayPreparation prep=new RaidDayPreparation();
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
            for(String option:OPTIONS[i])
                if(option.equals(prep.answers[i]))known=true;
            if(!known)prep.answers[i]="";
        }
        prep.complete=prefs.getBoolean(KEY+"completed",false)&&prep.allAnswered();
        prep.questionIndex=Math.max(0,Math.min(COUNT-1,
            prefs.getInt(KEY+"question",0)));
        return prep;
    }
    public boolean isComplete(){return complete&&allAnswered();}
    public int question(){return questionIndex;}
    public void setQuestion(int q){questionIndex=Math.max(0,Math.min(COUNT-1,q));}
    public String answer(int q){return answers[q];}
    public void choose(String selected){
        if(questionIndex==0)throw new IllegalStateException("Data usa ajuste por dias");
        for(String option:OPTIONS[questionIndex]){
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
        return "manual:"+answers[0]+":"+answers[1].replace(" ","_");
    }
    public String summary(){
        return "Dia: "+displayDate()+" (informado, não verificado)"+
            "\nLocal: "+answers[1]+
            "\nPasse anterior: "+answers[2]+" | Passe atual: "+answers[3]+
            "\nReide hoje: "+answers[4]+" | Já iniciou: "+answers[5]+
            "\nAviso/restrição: "+answers[6]+
            "\nModo escolhido: "+answers[7];
    }
    public void save(SharedPreferences prefs){
        SharedPreferences.Editor e=prefs.edit();
        for(int i=0;i<COUNT;i++)e.putString(KEY+"answer_"+i,answers[i]);
        e.putBoolean(KEY+"completed",isComplete());
        e.putInt(KEY+"question",questionIndex);
        e.apply();
    }
}
