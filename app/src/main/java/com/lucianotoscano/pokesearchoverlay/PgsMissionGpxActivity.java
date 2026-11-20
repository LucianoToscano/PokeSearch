package com.lucianotoscano.pokesearchoverlay;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.drawable.GradientDrawable;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.widget.Button;
import android.widget.CheckBox;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.util.Locale;
import java.security.MessageDigest;

/**
 * LT408: planejador GPX OFFLINE, com importação SAF e progresso local manual.
 * Não inicia ações no Pokémon GO, não controla GPS/PGSharp, não altera inventário.
 * Tela separada para não perturbar os cinco ícones e overlays existentes.
 */
public final class PgsMissionGpxActivity extends Activity {
    private static final int PICK_GPX = 6208;
    private static final String PREFS = "pgs_mission_gpx_planner_v1";
    private PgsMissionGpxPlan plan;
    private int visited;
    private String routeKey="";
    private int[] missionStates=new int[0];
    private TextView summary, next, notice;
    private Button previousButton, visitedButton, copyButton;
    private Button confirmButton, redeemButton, clearButton;
    private CheckBox[] preflightBoxes=new CheckBox[0];
    private TextView preflightSummary;
    private int preflightMask;
    private long preflightStartedAt;
    private boolean renderingPreflight;
    private boolean preflightExpanded;
    private boolean recordsExpanded;
    private boolean detailsExpanded;
    private Button preflightToggle, recordsToggle, detailsToggle;
    private LinearLayout preflightContent, recordsContent;
    private TextView routeDetails;

    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }
    private TextView text(String value, int size, int color) {
        TextView result = new TextView(this);
        result.setText(value);
        result.setTextSize(size);
        result.setTextColor(color);
        result.setGravity(Gravity.CENTER_VERTICAL);
        result.setPadding(dp(2), dp(8), dp(2), dp(8));
        return result;
    }
    private Button button(String value) {
        Button b = new Button(this);
        b.setText(value);
        b.setAllCaps(false);
        b.setTextSize(13);
        b.setTextColor(0xFFF4F7FF);
        GradientDrawable background = new GradientDrawable();
        background.setColor(0xFF202E41);
        background.setCornerRadius(dp(10));
        background.setStroke(dp(1), 0xFF516780);
        b.setBackground(background);
        b.setMinHeight(0);
        b.setMinimumHeight(0);
        return b;
    }
    private LinearLayout vertical(){
        LinearLayout group=new LinearLayout(this);
        group.setOrientation(LinearLayout.VERTICAL);
        return group;
    }

    private void add(LinearLayout root, View view, int height) {
        LinearLayout.LayoutParams params =
            new LinearLayout.LayoutParams(-1, height < 0 ? height : dp(height));
        params.bottomMargin = dp(8);
        root.addView(view, params);
    }
    private File localRoute() {
        return new File(getFilesDir(), "mission_route_private.gpx");
    }

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().setStatusBarColor(0xFF091425);
        getWindow().setNavigationBarColor(0xFF091425);
        ScrollView scroll = new ScrollView(this);
        scroll.setFillViewport(true);
        scroll.setBackgroundColor(0xFF091425);
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setPadding(dp(18), dp(14), dp(18), dp(18));
        scroll.addView(root);

        // LT409: três ações principais; conferências e registro só ao expandir.
        TextView title=text("MISSÕES GPX",20,Color.WHITE);
        title.setTypeface(null,android.graphics.Typeface.BOLD);
        add(root,title,-2);
        add(root,text("1. Importe sua rota. 2. Acompanhe os pontos. "
            +"3. Registre o que recebeu no jogo.",12,0xFFB7C6D7),-2);

        Button importButton=button("1 · Importar arquivo GPX");
        importButton.setOnClickListener(v->chooseFile());
        add(root,importButton,48);

        summary=text("",14,Color.WHITE);
        add(root,summary,-2);
        next=text("",14,0xFF85E0B7);
        add(root,next,-2);

        copyButton=button("Copiar coordenada deste ponto");
        copyButton.setOnClickListener(v->copyCurrent());
        add(root,copyButton,46);
        visitedButton=button("Próximo ponto · marcar visitado");
        visitedButton.setOnClickListener(v->changeVisited(1));
        add(root,visitedButton,46);

        recordsToggle=button("2 · Registrar pesquisas e doces ▾");
        recordsToggle.setOnClickListener(v->{
            recordsExpanded=!recordsExpanded;
            recordsContent.setVisibility(recordsExpanded?View.VISIBLE:View.GONE);
            recordsToggle.setText(recordsExpanded?
                "2 · Ocultar registro de pesquisas ▴":
                "2 · Registrar pesquisas e doces ▾");
        });
        add(root,recordsToggle,44);
        recordsContent=vertical();
        add(root,recordsContent,-2);
        confirmButton=button("✓ Encontrei a pesquisa correta");
        confirmButton.setOnClickListener(v->confirmResearch());
        add(recordsContent,confirmButton,44);
        redeemButton=button("✓ Resgatei 25 doces");
        redeemButton.setOnClickListener(v->confirmRedeemed());
        add(recordsContent,redeemButton,44);
        previousButton=button("← Ponto anterior");
        previousButton.setOnClickListener(v->changeVisited(-1));
        add(recordsContent,previousButton,42);
        clearButton=button("Desfazer registro deste ponto");
        clearButton.setOnClickListener(v->updateMission(0));
        add(recordsContent,clearButton,42);
        recordsContent.setVisibility(View.GONE);

        appendPreflight(root);

        detailsToggle=button("Detalhes da rota ▾");
        detailsToggle.setOnClickListener(v->{
            detailsExpanded=!detailsExpanded;
            routeDetails.setVisibility(detailsExpanded?View.VISIBLE:View.GONE);
            detailsToggle.setText(detailsExpanded?
                "Ocultar detalhes da rota ▴":"Detalhes da rota ▾");
        });
        add(root,detailsToggle,40);
        routeDetails=text("",11,0xFFB7C6D7);
        add(root,routeDetails,-2);
        routeDetails.setVisibility(View.GONE);

        Button copyFilter=button("Copiar filtro de missões");
        copyFilter.setOnClickListener(v->copySearchPreset());
        add(root,copyFilter,40);
        add(root,text("Eternatus #890 · Lançamento excelente · "
            +"25 doces por pesquisa (quando disponível).",11,0xFFB7C6D7),-2);

        notice=text("Este planejador ainda não executa um farm noturno. "
            +"O giro, o lançamento e o resgate continuam no jogo.",
            11,0xFFFFD492);
        add(root,notice,-2);
        Button close=button("← Voltar ao PokeSearch");
        close.setOnClickListener(v->finish());
        add(root,close,42);
        setContentView(scroll);
        restoreLocalRoute();
        render();
    }

    private void chooseFile() {
        Intent pick = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        pick.addCategory(Intent.CATEGORY_OPENABLE);
        // Exploradores Android não padronizam MIME para arquivos .GPX.
        pick.setType("*/*");
        startActivityForResult(pick, PICK_GPX);
    }

    @Override protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode != PICK_GPX || resultCode != RESULT_OK ||
                data == null || data.getData() == null) return;
        try (InputStream in = getContentResolver().openInputStream(data.getData())) {
            byte[] bytes = PgsMissionGpxPlan.readLimited(in);
            PgsMissionGpxPlan parsed = PgsMissionGpxPlan.parse(bytes);
            try (FileOutputStream output = new FileOutputStream(localRoute())) {
                output.write(bytes);
            }
            plan = parsed;
            String newRouteKey=routeHash(bytes);
            boolean sameRoute=newRouteKey.equals(routeKey);
            routeKey=newRouteKey;
            loadMissionStates();
            loadPreflight();
            visited = sameRoute?visited:Math.max(0,Math.min(plan.stops.size(),
                getSharedPreferences(PREFS,MODE_PRIVATE).getInt(routeKey+"_visited",0)));
            persistVisited();
            render();
            Toast.makeText(this, "GPX validado e salvo apenas neste aparelho.",
                Toast.LENGTH_LONG).show();
        } catch (Exception ex) {
            // Nenhum dado parcial substitui a rota anteriormente válida.
            Toast.makeText(this, "Falha ao importar GPX: " + ex.getMessage(),
                Toast.LENGTH_LONG).show();
        }
    }

    private void restoreLocalRoute() {
        File file = localRoute();
        if (!file.isFile()) return;
        try (FileInputStream in = new FileInputStream(file)) {
            byte[] bytes=PgsMissionGpxPlan.readLimited(in);
            plan = PgsMissionGpxPlan.parse(bytes);
            routeKey=routeHash(bytes);
            loadMissionStates();
            loadPreflight();
            visited = Math.max(0, Math.min(plan.stops.size(),
                getSharedPreferences(PREFS, MODE_PRIVATE).getInt(routeKey+"_visited", 0)));
        } catch (Exception ignored) {
            // Prévia não deve bloquear o lançamento do aplicativo.
            plan = null;
            routeKey="";
            missionStates=new int[0];
            preflightMask=0;
            preflightStartedAt=0;
            visited = 0;
        }
    }
    private static String routeHash(byte[] bytes) throws Exception {
        byte[] hash=MessageDigest.getInstance("SHA-256").digest(bytes);
        StringBuilder key=new StringBuilder("route_");
        for(byte b:hash)key.append(String.format(Locale.US,"%02x",b&255));
        return key.toString();
    }
    private void appendPreflight(LinearLayout root) {
        preflightToggle=button("3 · Preparação · 0/7 ▾");
        preflightToggle.setOnClickListener(v->{
            preflightExpanded=!preflightExpanded;
            preflightContent.setVisibility(
                preflightExpanded?View.VISIBLE:View.GONE);
            render();
        });
        add(root,preflightToggle,44);
        preflightContent=vertical();
        add(root,preflightContent,-2);

        String[] labels={
            "Rota e pesquisas recentes conferidas no site",
            "Tenho três vagas de Pesquisas de Campo",
            "Tenho espaço para capturar Pokémon",
            "A mochila tem espaço para itens",
            "Conferi Virtual Go Plus e giro no PGSharp",
            "A tarefa e os 25 doces foram vistos no jogo",
            "Revisei as esperas e cooldown"
        };
        preflightBoxes=new CheckBox[PgsMissionPreflightPolicy.ITEMS.length];
        for(int i=0;i<preflightBoxes.length;i++){
            final int flag=PgsMissionPreflightPolicy.ITEMS[i];
            CheckBox box=new CheckBox(this);
            box.setText(labels[i]);
            box.setTextSize(12);
            box.setTextColor(0xFFDFE8F3);
            box.setOnCheckedChangeListener((b,checked)->{
                if(renderingPreflight||plan==null)return;
                long now=System.currentTimeMillis();
                if(!PgsMissionPreflightPolicy.current(preflightStartedAt,now)){
                    preflightMask=0;
                    preflightStartedAt=now;
                }
                preflightMask=PgsMissionPreflightPolicy.set(preflightMask,flag,checked);
                getSharedPreferences(PREFS,MODE_PRIVATE).edit()
                    .putInt(routeKey+"_checks",preflightMask)
                    .putLong(routeKey+"_checksAt",preflightStartedAt).apply();
                render();
            });
            preflightBoxes[i]=box;
            add(preflightContent,box,-2);
        }
        preflightSummary=text("",11,0xFFFFD492);
        add(preflightContent,preflightSummary,-2);
        preflightContent.setVisibility(View.GONE);
    }

    private void loadPreflight(){
        android.content.SharedPreferences prefs=getSharedPreferences(PREFS,MODE_PRIVATE);
        preflightStartedAt=prefs.getLong(routeKey+"_checksAt",0L);
        preflightMask=PgsMissionPreflightPolicy.current(
            preflightStartedAt,System.currentTimeMillis())?
            PgsMissionPreflightPolicy.sanitize(
                prefs.getInt(routeKey+"_checks",0)):0;
        if(preflightMask==0)preflightStartedAt=0L;
    }

    private void loadMissionStates() {
        missionStates=new int[plan.stops.size()];
        android.content.SharedPreferences prefs=getSharedPreferences(PREFS,MODE_PRIVATE);
        for(int i=0;i<missionStates.length;i++)
            missionStates[i]=PgsMissionLedgerPolicy.normalize(
                prefs.getInt(routeKey+"_mission_"+i,0));
    }
    private void copySearchPreset() {
        ClipboardManager clipboard=(ClipboardManager)
            getSystemService(Context.CLIPBOARD_SERVICE);
        if(clipboard==null)return;
        clipboard.setPrimaryClip(ClipData.newPlainText(
            "Filtro Eternatus",PgsMissionQuestPreset.copyableFilter()));
        Toast.makeText(this,"Filtro copiado.",Toast.LENGTH_SHORT).show();
    }

    private void confirmResearch(){
        if(plan==null||visited>=missionStates.length)return;
        new AlertDialog.Builder(this)
            .setTitle("Confirmar a pesquisa correta")
            .setMessage("Você verificou no Pokémon GO que ESTA Poképarada "
                +"entregou a pesquisa 'Make an Excellent Throw' com recompensa "
                +"de 25 doces de Eternatus? O GPX e o filtro do site "
                +"não comprovam que a tarefa foi recebida.")
            .setNegativeButton("Ainda não",null)
            .setPositiveButton("Sim, conferi no jogo",(d,which)->updateMission(1))
            .show();
    }

    private void confirmRedeemed(){
        if(plan==null||visited>=missionStates.length)return;
        new AlertDialog.Builder(this)
            .setTitle("Confirmar recompensa resgatada")
            .setMessage("Você já concluiu a pesquisa e RESGATOU os "
                +"25 doces de Eternatus no jogo? Somente a recompensa "
                +"efetivamente resgatada deve entrar no contador.")
            .setNegativeButton("Ainda não",null)
            .setPositiveButton("Sim, resgatei",(d,which)->updateMission(2))
            .show();
    }

    private void updateMission(int action) {
        if(plan==null||visited>=missionStates.length)return;
        int old=missionStates[visited];
        int updated=action==1?PgsMissionLedgerPolicy.confirmTask(old):
            action==2?PgsMissionLedgerPolicy.redeem(old):PgsMissionLedgerPolicy.clear(old);
        if(action==2&&old!=PgsMissionLedgerPolicy.TASK_CONFIRMED){
            Toast.makeText(this,"Confirme primeiro a pesquisa recebida.",Toast.LENGTH_LONG).show();
            return;
        }
        missionStates[visited]=updated;
        getSharedPreferences(PREFS,MODE_PRIVATE).edit()
            .putInt(routeKey+"_mission_"+visited,updated).apply();
        render();
    }
    private void persistVisited() {
        getSharedPreferences(PREFS, MODE_PRIVATE).edit()
            .putInt(routeKey+"_visited", visited).apply();
    }
    private void changeVisited(int change) {
        if (plan == null) return;
        visited = Math.min(plan.stops.size(), Math.max(0, visited + change));
        persistVisited();
        render();
    }
    private void copyCurrent() {
        if (plan == null || visited >= plan.stops.size()) return;
        PgsMissionGpxPlan.Stop stop = plan.stops.get(visited);
        ClipboardManager clipboard = (ClipboardManager)
            getSystemService(Context.CLIPBOARD_SERVICE);
        if (clipboard != null) {
            clipboard.setPrimaryClip(ClipData.newPlainText(
                "Coordenada GPX", stop.coordinates()));
            Toast.makeText(this, "Coordenada copiada.", Toast.LENGTH_SHORT).show();
        }
    }

    private void render() {
        boolean has=plan!=null;
        if(has&&!PgsMissionPreflightPolicy.current(
                preflightStartedAt,System.currentTimeMillis()))
            preflightMask=0;
        renderingPreflight=true;
        try{
            for(int i=0;i<preflightBoxes.length;i++){
                CheckBox box=preflightBoxes[i];
                box.setEnabled(has);
                box.setChecked(has&&(preflightMask&
                    PgsMissionPreflightPolicy.ITEMS[i])!=0);
            }
        }finally{renderingPreflight=false;}
        int checks=PgsMissionPreflightPolicy.count(preflightMask);
        preflightToggle.setText("3 · Preparação · "+checks+
            "/7 "+(preflightExpanded?"▴":"▾"));
        preflightToggle.setEnabled(has);
        preflightSummary.setText("Conferências manuais. Não ativam farm automático.");

        boolean active=has&&visited<missionStates.length;
        copyButton.setEnabled(active);
        visitedButton.setEnabled(active);
        previousButton.setEnabled(has&&visited>0);
        confirmButton.setEnabled(active&&missionStates[visited]==
            PgsMissionLedgerPolicy.UNKNOWN);
        redeemButton.setEnabled(active&&missionStates[visited]==
            PgsMissionLedgerPolicy.TASK_CONFIRMED);
        clearButton.setEnabled(active&&missionStates[visited]!=
            PgsMissionLedgerPolicy.UNKNOWN);
        recordsToggle.setEnabled(has);
        detailsToggle.setEnabled(has);

        if(!has){
            summary.setText("Nenhuma rota carregada.");
            next.setText("Toque em Importar arquivo GPX para começar.");
            routeDetails.setText("Carregue um arquivo GPX para visualizar os detalhes.");
            return;
        }
        int count=plan.stops.size();
        int tasks=PgsMissionLedgerPolicy.count(
            missionStates,PgsMissionLedgerPolicy.TASK_CONFIRMED);
        int redeemed=PgsMissionLedgerPolicy.count(
            missionStates,PgsMissionLedgerPolicy.REWARD_REDEEMED);
        int candies=PgsMissionLedgerPolicy.candies(missionStates);
        summary.setText(String.format(Locale.US,
            "Pontos: %d/%d · Pesquisas aguardando resgate: %d\n"
            +"Recompensas resgatadas: %d · Doces registrados manualmente: %d",
            visited,count,tasks,redeemed,candies));
        routeDetails.setText(String.format(Locale.US,
            "Coordenadas: %d · Trios candidatos: %d · Sobra: %d\n"
            +"Distância em linha reta somada: %.2f km; maior salto: %.2f km.\n"
            +"Repetições: %d. Projeção matemática condicional: %d doces.\n"
            +"O GPX não confirma tarefa, recompensa, cooldown ou validade.",
            count,plan.fullGroups(),plan.leftoverStops(),
            plan.cumulativeDistanceKm,plan.longestHopKm,
            plan.repeatedCoordinates,plan.possibleCandiesIfAllVerified()));
        if(visited>=count){
            next.setText("Fim da rota. Confira os registros efetuados.");
            return;
        }
        PgsMissionGpxPlan.Stop stop=plan.stops.get(visited);
        String state=missionStates[visited]==PgsMissionLedgerPolicy.REWARD_REDEEMED?
            "25 doces registrados":missionStates[visited]==
            PgsMissionLedgerPolicy.TASK_CONFIRMED?
            "Pesquisa registrada; resgate pendente":"Pesquisa não confirmada";
        next.setText(String.format(Locale.US,
            "Ponto %d de %d · %s\n%s\n%s",
            visited+1,count,stop.name,stop.coordinates(),state));
    }
}
