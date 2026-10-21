package com.lucianotoscano.pokesearchoverlay;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.ClipData;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

/** Base nova: somente HOME e preferências locais. Não inicializa overlay ou WebView. */
public final class MainActivity extends Activity {
    private static final int EXPORT_DATA = 501;
    private static final int IMPORT_DATA = 502;
    private static final String PREFS = "pokesearch_home";
    private boolean dark;
    private SharedPreferences preferences;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        preferences = getSharedPreferences(PREFS, MODE_PRIVATE);
        dark = preferences.getBoolean("dark_theme", true);
        showHome();
    }

    private int dp(float amount) {
        return Math.round(amount * getResources().getDisplayMetrics().density);
    }

    private GradientDrawable rounded(int fill, float radiusDp) {
        GradientDrawable shape = new GradientDrawable();
        shape.setColor(fill);
        shape.setCornerRadius(dp(radiusDp));
        return shape;
    }

    private void showHome() {
        final int ink = dark ? Color.WHITE : Color.rgb(13, 44, 81);
        final int glass = dark ? Color.argb(184, 5, 18, 42) : Color.argb(204, 232, 250, 255);
        final int tileGlass = dark ? Color.argb(166, 3, 22, 48) : Color.argb(200, 221, 246, 255);

        Window window = getWindow();
        window.setStatusBarColor(dark ? Color.rgb(3, 17, 38) : Color.rgb(57, 147, 217));
        window.setNavigationBarColor(dark ? Color.rgb(2, 16, 36) : Color.rgb(42, 132, 194));
        window.getDecorView().setSystemUiVisibility(dark ? 0
                : View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR | View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR);

        FrameLayout root = new FrameLayout(this);
        ImageView background = new ImageView(this);
        background.setImageResource(dark ? R.drawable.ps_home_background_dark : R.drawable.ps_home_background_light);
        background.setScaleType(ImageView.ScaleType.CENTER_CROP);
        background.setContentDescription("Paisagem PokeSearch " + (dark ? "escura" : "clara"));
        root.addView(background, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));

        // Cabeçalho discreto: menu à esquerda, tema e login à direita.
        LinearLayout header = new LinearLayout(this);
        header.setGravity(Gravity.CENTER_VERTICAL);
        header.setPadding(dp(16), 0, dp(16), 0);
        FrameLayout.LayoutParams headerParams = new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, dp(60), Gravity.TOP);
        headerParams.topMargin = dp(11);
        root.addView(header, headerParams);

        header.addView(roundButton(R.drawable.ps_menu, "Abrir menu", ink, tileGlass, this::showMenu),
                new LinearLayout.LayoutParams(dp(48), dp(48)));
        View spacer = new View(this);
        header.addView(spacer, new LinearLayout.LayoutParams(0, 1, 1));
        header.addView(roundButton(dark ? R.drawable.ps_sun : R.drawable.ps_moon,
                        dark ? "Ativar modo claro" : "Ativar modo escuro", ink, tileGlass, this::toggleTheme),
                new LinearLayout.LayoutParams(dp(48), dp(48)));
        View smallGap = new View(this);
        header.addView(smallGap, new LinearLayout.LayoutParams(dp(8), 1));
        header.addView(roundButton(R.drawable.ps_login, "Login", ink, tileGlass, this::showLogin),
                new LinearLayout.LayoutParams(dp(48), dp(48)));

        // A logo original fica centralizada na área livre da paisagem.
        ImageView logo = new ImageView(this);
        logo.setImageResource(R.drawable.ps_home_brand);
        logo.setScaleType(ImageView.ScaleType.FIT_CENTER);
        logo.setContentDescription("Logo oficial PokeSearch");
        FrameLayout.LayoutParams logoParams = new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, dp(170), Gravity.TOP);
        logoParams.topMargin = Math.max(dp(105), Math.round(getResources().getDisplayMetrics().heightPixels * 0.17f));
        logoParams.leftMargin = dp(45);
        logoParams.rightMargin = dp(45);
        root.addView(logo, logoParams);

        // Ações principais, adaptadas à largura do aparelho.
        LinearLayout actionDock = new LinearLayout(this);
        actionDock.setOrientation(LinearLayout.HORIZONTAL);
        actionDock.setGravity(Gravity.CENTER);
        actionDock.setPadding(dp(5), dp(5), dp(5), dp(5));
        actionDock.setBackground(rounded(glass, 21));
        FrameLayout.LayoutParams dockParams = new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, dp(82), Gravity.BOTTOM);
        dockParams.setMargins(dp(10), 0, dp(10), dp(18));
        root.addView(actionDock, dockParams);

        addDockItem(actionDock, R.drawable.ps_heart, "Doar", "Apoiar PokeSearch", ink, this::showDonation);
        addDockItem(actionDock, R.drawable.ps_bug, "Reportar", "Reportar bug", ink, this::reportBug);
        addDockItem(actionDock, R.drawable.ps_overlay, "Overlay", "Abrir overlay", ink, this::showOverlay);
        addDockItem(actionDock, R.drawable.ps_import, "Importar", "Importar dados", ink, this::importData);
        addDockItem(actionDock, R.drawable.ps_export, "Exportar", "Exportar dados", ink, this::exportData);

        setContentView(root);
    }

    private View roundButton(int drawable, String description, int ink, int fill, Runnable action) {
        FrameLayout circle = new FrameLayout(this);
        circle.setBackground(rounded(fill, 18));
        circle.setContentDescription(description);
        circle.setFocusable(true);
        circle.setClickable(true);
        ImageView image = new ImageView(this);
        image.setImageResource(drawable);
        image.setColorFilter(ink);
        image.setScaleType(ImageView.ScaleType.FIT_CENTER);
        FrameLayout.LayoutParams lp = new FrameLayout.LayoutParams(dp(25), dp(25), Gravity.CENTER);
        circle.addView(image, lp);
        circle.setOnClickListener(v -> action.run());
        return circle;
    }

    private void addDockItem(LinearLayout dock, int icon, String label, String description, int ink, Runnable action) {
        LinearLayout button = new LinearLayout(this);
        button.setOrientation(LinearLayout.VERTICAL);
        button.setGravity(Gravity.CENTER);
        button.setContentDescription(description);
        button.setClickable(true);
        button.setFocusable(true);
        ImageView image = new ImageView(this);
        image.setImageResource(icon);
        image.setColorFilter(ink);
        image.setScaleType(ImageView.ScaleType.FIT_CENTER);
        button.addView(image, new LinearLayout.LayoutParams(dp(25), dp(25)));
        TextView title = new TextView(this);
        title.setText(label);
        title.setTextColor(ink);
        title.setGravity(Gravity.CENTER);
        title.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        title.setTextSize(10);
        LinearLayout.LayoutParams tp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, dp(19));
        tp.topMargin = dp(4);
        button.addView(title, tp);
        dock.addView(button, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.MATCH_PARENT, 1f));
        button.setOnClickListener(v -> action.run());
    }

    private void toggleTheme() {
        dark = !dark;
        preferences.edit().putBoolean("dark_theme", dark).apply();
        showHome();
    }

    private void showMenu() {
        String[] names = new String[] {"Início", "Alternar claro / escuro", "Login",
                "Overlay", "Doar", "Reportar bug", "Importar dados", "Exportar dados"};
        new AlertDialog.Builder(this)
                .setTitle("PokeSearch")
                .setItems(names, (dialog, which) -> {
                    switch (which) {
                        case 0: showHome(); break;
                        case 1: toggleTheme(); break;
                        case 2: showLogin(); break;
                        case 3: showOverlay(); break;
                        case 4: showDonation(); break;
                        case 5: reportBug(); break;
                        case 6: importData(); break;
                        case 7: exportData(); break;
                        default: break;
                    }
                })
                .setNegativeButton("Fechar", null)
                .show();
    }

    private void showDonation() {
        PixSupport.show(this);
    }

    private void reportBug() {
        String report = "PokeSearch — relatório de bug\nVersão: " + getAppVersion()
                + "\nAndroid: " + android.os.Build.VERSION.RELEASE
                + "\n\nDescreva o problema aqui:\n";
        Intent message = new Intent(Intent.ACTION_SEND);
        message.setType("text/plain");
        message.putExtra(Intent.EXTRA_SUBJECT, "Bug PokeSearch");
        message.putExtra(Intent.EXTRA_TEXT, report);
        try {
            startActivity(Intent.createChooser(message, "Compartilhar relatório de bug"));
        } catch (Exception e) {
            Toast.makeText(this, "Nenhum aplicativo para compartilhar o relatório.", Toast.LENGTH_LONG).show();
        }
    }

    private String getAppVersion() {
        try {
            return getPackageManager().getPackageInfo(getPackageName(), 0).versionName;
        } catch (Exception ignored) {
            return "HOME";
        }
    }

    private void showLogin() {
        new AlertDialog.Builder(this)
                .setTitle("Login")
                .setMessage("Ícone adicionado. A integração de login será definida na próxima etapa.")
                .setPositiveButton("OK", null)
                .show();
    }

    private void showOverlay() {
        new AlertDialog.Builder(this)
                .setTitle("Overlay")
                .setMessage("Ícone adicionado. O novo overlay será desenvolvido separadamente, sem recuperar os serviços da versão antiga.")
                .setPositiveButton("OK", null)
                .show();
    }

    private void exportData() {
        Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("application/json");
        intent.putExtra(Intent.EXTRA_TITLE, "PokeSearch-dados.json");
        try {
            startActivityForResult(intent, EXPORT_DATA);
        } catch (Exception e) {
            Toast.makeText(this, "Não foi possível abrir o seletor de arquivos.", Toast.LENGTH_LONG).show();
        }
    }

    private void importData() {
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType("application/json");
        try {
            startActivityForResult(intent, IMPORT_DATA);
        } catch (Exception e) {
            Toast.makeText(this, "Não foi possível abrir o seletor de arquivos.", Toast.LENGTH_LONG).show();
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (resultCode != RESULT_OK || data == null || data.getData() == null) return;
        Uri uri = data.getData();
        if (requestCode == EXPORT_DATA) writeData(uri);
        else if (requestCode == IMPORT_DATA) readData(uri);
    }

    private void writeData(Uri uri) {
        try {
            JSONObject json = new JSONObject();
            json.put("app", "PokeSearch");
            json.put("schema", 1);
            json.put("theme", dark ? "dark" : "light");
            try (OutputStream out = getContentResolver().openOutputStream(uri, "wt")) {
                if (out == null) throw new IllegalStateException("Destino indisponível");
                out.write(json.toString(2).getBytes(StandardCharsets.UTF_8));
            }
            Toast.makeText(this, "Dados exportados com sucesso.", Toast.LENGTH_SHORT).show();
        } catch (Exception e) {
            Toast.makeText(this, "Falha ao exportar dados.", Toast.LENGTH_LONG).show();
        }
    }

    private void readData(Uri uri) {
        try (InputStream input = getContentResolver().openInputStream(uri)) {
            if (input == null) throw new IllegalStateException("Arquivo indisponível");
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            byte[] buffer = new byte[4096];
            int count;
            while ((count = input.read(buffer)) != -1) {
                if (out.size() + count > 65536) throw new IllegalArgumentException("Arquivo grande demais");
                out.write(buffer, 0, count);
            }
            JSONObject json = new JSONObject(new String(out.toByteArray(), StandardCharsets.UTF_8));
            if (!"PokeSearch".equals(json.optString("app")) || json.optInt("schema", -1) != 1)
                throw new IllegalArgumentException("Não é um arquivo PokeSearch válido");
            String theme = json.getString("theme");
            if (!"dark".equals(theme) && !"light".equals(theme))
                throw new IllegalArgumentException("Tema inválido");
            dark = "dark".equals(theme);
            preferences.edit().putBoolean("dark_theme", dark).apply();
            showHome();
            Toast.makeText(this, "Preferências importadas com sucesso.", Toast.LENGTH_SHORT).show();
        } catch (Exception e) {
            new AlertDialog.Builder(this)
                    .setTitle("Importação não concluída")
                    .setMessage("Selecione um JSON exportado pelo PokeSearch. Nenhuma preferência foi alterada.")
                    .setPositiveButton("OK", null).show();
        }
    }
}
