package com.lucianotoscano.pokesearchoverlay;

import android.app.Activity;
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

        TextView title = text("AUTO HUNT · PLANEJADOR GPX", 18, Color.WHITE);
        title.setTypeface(null, android.graphics.Typeface.BOLD);
        add(root, title, -2);
        add(root, text("Leitura local de rotas de pesquisa de campo. "
            + "Nenhuma coordenada é enviada para servidores.", 12, 0xFFB7C6D7), -2);
        Button importButton = button("Importar GPX do aparelho");
        importButton.setOnClickListener(v -> chooseFile());
        add(root, importButton, 48);

        appendPreflight(root);
        summary = text("", 14, Color.WHITE);
        add(root, summary, -2);
        next = text("", 14, 0xFF85E0B7);
        add(root, next, -2);
        copyButton = button("Copiar coordenada atual");
        copyButton.setOnClickListener(v -> copyCurrent());
        add(root, copyButton, 44);
        visitedButton = button("Marcar ponto visitado manualmente");
        visitedButton.setOnClickListener(v -> changeVisited(1));
        add(root, visitedButton, 44);
        confirmButton=button("Confirmar pesquisa de 25 doces (manual)");
        confirmButton.setOnClickListener(v->updateMission(1));
        add(root,confirmButton,44);
        redeemButton=button("Confirmar resgate de 25 doces (manual)");
        redeemButton.setOnClickListener(v->updateMission(2));
        add(root,redeemButton,44);
        clearButton=button("Desfazer confirmação deste ponto");
        clearButton.setOnClickListener(v->updateMission(0));
        add(root,clearButton,44);
        previousButton = button("Voltar um ponto");
        previousButton.setOnClickListener(v -> changeVisited(-1));
        add(root, previousButton, 44);

        notice = text("Atenção: esta tela ainda não executa um farm noturno. "
            + "O GPX não confirma pesquisa, cooldown, teleporte, giro, "
            + "lançamento excelente ou resgate. Todo progresso aqui é manual.", 
            12, 0xFFFFD492);
        add(root, notice, -2);
        Button close = button("← Voltar ao PokeSearch");
        close.setOnClickListener(v -> finish());
        add(root, close, 44);
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
        TextView title=text("CONFERÊNCIAS ANTES DA SESSÃO (MANUAL)",13,Color.WHITE);
        title.setTypeface(null,android.graphics.Typeface.BOLD);
        add(root,title,-2);
        String[] labels={
            "Conferi no site que a rota e as tarefas ainda são atuais",
            "Há vagas suficientes para três Pesquisas de Campo",
            "O estoque de Pokémon tem espaço livre (vídeo: estava cheio)",
            "A bolsa de itens tem espaço para o giro das Poképaradas",
            "No PGSharp, conferi GoPlus Virtual e PokéParada Próxima",
            "Conferi no jogo a tarefa e a recompensa de 25 doces de Eternatus",
            "Revisei manualmente as esperas e o cooldown aplicável"
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
            add(root,box,-2);
        }
        preflightSummary=text("",12,0xFFFFD492);
        add(root,preflightSummary,-2);
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
        boolean has = plan != null;
        if(has&&!PgsMissionPreflightPolicy.current(
                preflightStartedAt,System.currentTimeMillis()))
            preflightMask=0;
        renderingPreflight=true;
        try {
            for(int i=0;i<preflightBoxes.length;i++){
                CheckBox box=preflightBoxes[i];
                box.setEnabled(has);
                box.setChecked(has&&(preflightMask&
                    PgsMissionPreflightPolicy.ITEMS[i])!=0);
            }
        }finally { renderingPreflight=false; }
        preflightSummary.setText(!has?
            "Importe um GPX para registrar as conferências.":
            "Checklist manual: "+PgsMissionPreflightPolicy.count(preflightMask)+
            "/7. As marcações são declarações do usuário, não leituras do jogo. "+
            "Mesmo completo, não ativa farm automático.");
        copyButton.setEnabled(has && visited < plan.stops.size());
        visitedButton.setEnabled(has && visited < plan.stops.size());
        previousButton.setEnabled(has && visited > 0);
        boolean active=has&&visited<missionStates.length;
        int state=active?missionStates[visited]:0;
        confirmButton.setEnabled(active&&state==PgsMissionLedgerPolicy.UNKNOWN);
        redeemButton.setEnabled(active&&state==PgsMissionLedgerPolicy.TASK_CONFIRMED);
        clearButton.setEnabled(active&&state!=PgsMissionLedgerPolicy.UNKNOWN);
        if (!has) {
            summary.setText("Nenhum GPX importado.");
            next.setText("Escolha um arquivo GPX para visualizar os pontos.");
            return;
        }
        int count = plan.stops.size();
        summary.setText(String.format(Locale.US,
            "%d pontos · %d trios candidatos · %d pontos restantes fora de trios.\n"
            + "Projeção apenas hipotética: até %d doces, se cada pesquisa "
            + "for válida e conceder 25 doces.\n"
            + "Coordenadas repetidas: %d.\n"
            + "Pesquisas confirmadas: %d · Resgates confirmados: %d.\n"
            + "Doces registrados manualmente: %d.",
            count, plan.fullGroups(), plan.leftoverStops(),
            plan.possibleCandiesIfAllVerified(), plan.repeatedCoordinates,
            PgsMissionLedgerPolicy.count(missionStates,PgsMissionLedgerPolicy.TASK_CONFIRMED),
            PgsMissionLedgerPolicy.count(missionStates,PgsMissionLedgerPolicy.REWARD_REDEEMED),
            PgsMissionLedgerPolicy.candies(missionStates)));
        if (visited >= count) {
            next.setText("Fim da lista: " + count + "/" + count
                + " pontos marcados manualmente.");
            return;
        }
        PgsMissionGpxPlan.Stop stop = plan.stops.get(visited);
        next.setText(String.format(Locale.US,
            "Progresso: %d/%d pontos marcados\n"
            + "Próximo: %s · conjunto candidato %d · posição %d/3\n%s\n"
            + "Estado informado manualmente: %s",
            visited, count, stop.name, visited / 3 + 1, visited % 3 + 1,
            stop.coordinates(),
            missionStates[visited]==PgsMissionLedgerPolicy.REWARD_REDEEMED?
                "recompensa resgatada":missionStates[visited]==
                PgsMissionLedgerPolicy.TASK_CONFIRMED?
                "pesquisa confirmada":"não confirmado"));
    }
}
