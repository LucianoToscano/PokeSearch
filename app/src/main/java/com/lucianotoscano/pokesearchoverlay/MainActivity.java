package com.lucianotoscano.pokesearchoverlay;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.res.Configuration;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Build;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.widget.EditText;
import android.widget.FrameLayout;
import android.widget.ImageButton;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.PopupMenu;
import android.widget.TextView;
import android.widget.Toast;
import android.text.InputType;

/**
 * PokeSearch HOME v1.
 * Novo código independente da antiga implementação do overlay.
 * Login/overlay são pontos de entrada, não serviços simulados.
 */
public final class MainActivity extends Activity {
    private static final String PREF_FILE = "ps_home_preferences";
    private static final String KEY_DARK = "dark_background";
    private boolean dark;

    private int dp(float value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }

    private boolean isSystemDark() {
        return (getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK)
            == Configuration.UI_MODE_NIGHT_YES;
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        SharedPreferences settings = getSharedPreferences(PREF_FILE, MODE_PRIVATE);
        dark = settings.getBoolean(KEY_DARK, isSystemDark());
        buildHome();
    }

    private int ink() {
        return dark ? Color.WHITE : Color.rgb(7, 38, 79);
    }

    private int buttonColor() {
        return dark ? Color.argb(136, 3, 24, 57) : Color.argb(148, 234, 249, 255);
    }

    private GradientDrawable pill(int color, float radius) {
        GradientDrawable bg = new GradientDrawable();
        bg.setColor(color);
        bg.setCornerRadius(dp(radius));
        return bg;
    }

    private int statusBarHeight() {
        int id = getResources().getIdentifier("status_bar_height", "dimen", "android");
        return id > 0 ? getResources().getDimensionPixelSize(id) : dp(24);
    }

    private void configureSystemBars() {
        Window window = getWindow();
        window.setStatusBarColor(Color.TRANSPARENT);
        window.setNavigationBarColor(dark ? Color.rgb(2, 17, 43) : Color.rgb(54, 155, 226));
        int flags = View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN | View.SYSTEM_UI_FLAG_LAYOUT_STABLE;
        if (!dark) flags |= View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR |
            View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
        window.getDecorView().setSystemUiVisibility(flags);
    }

    private ImageButton imageAction(int icon, String name, View.OnClickListener listener) {
        ImageButton button = new ImageButton(this);
        button.setImageResource(icon);
        button.setColorFilter(ink());
        button.setScaleType(ImageView.ScaleType.FIT_CENTER);
        button.setBackground(pill(buttonColor(), 16));
        button.setPadding(dp(11), dp(11), dp(11), dp(11));
        button.setContentDescription(name);
        button.setTooltipText(name);
        button.setOnClickListener(listener);
        button.setFocusable(true);
        return button;
    }

    private void appendIcon(LinearLayout row, int icon, String name,
                            View.OnClickListener listener, int margin) {
        ImageButton button = imageAction(icon, name, listener);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(dp(44), dp(44));
        lp.setMarginStart(dp(margin));
        row.addView(button, lp);
    }

    private LinearLayout makeLoginButton() {
        LinearLayout button = new LinearLayout(this);
        button.setOrientation(LinearLayout.HORIZONTAL);
        button.setGravity(Gravity.CENTER);
        button.setPadding(dp(10), 0, dp(12), 0);
        button.setBackground(pill(buttonColor(), 15));
        button.setMinimumHeight(dp(44));
        button.setContentDescription("Login");
        button.setFocusable(true);
        button.setOnClickListener(view -> showPending("Login",
            "O acesso ainda não foi configurado nesta nova base. A próxima etapa definirá o serviço de autenticação."));

        ImageView glyph = new ImageView(this);
        glyph.setImageResource(R.drawable.ps_login);
        glyph.setColorFilter(ink());
        button.addView(glyph, new LinearLayout.LayoutParams(dp(19), dp(19)));

        TextView label = new TextView(this);
        label.setText("Login");
        label.setTextColor(ink());
        label.setTextSize(13);
        label.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        LinearLayout.LayoutParams textLp = new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        textLp.setMarginStart(dp(6));
        button.addView(label, textLp);
        return button;
    }

    private void buildHome() {
        configureSystemBars();
        FrameLayout screen = new FrameLayout(this);
        screen.setBackgroundColor(dark ? Color.rgb(2, 16, 42) : Color.rgb(53, 146, 220));

        ImageView background = new ImageView(this);
        background.setImageResource(dark ? R.drawable.ps_bg_escuro : R.drawable.ps_bg_claro);
        background.setScaleType(ImageView.ScaleType.CENTER_CROP);
        background.setContentDescription(dark ? "Background PokeSearch Escuro" :
            "Background PokeSearch Claro");
        screen.addView(background, new FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.MATCH_PARENT));

        // Gradiente leve: mantém a imagem original visível, inclusive sob a barra de status.
        View contrast = new View(this);
        GradientDrawable gradient = new GradientDrawable(GradientDrawable.Orientation.TOP_BOTTOM,
            dark ? new int[]{0xA0000C25, 0x34000C25, 0x00000C25} :
                   new int[]{0x70E7F7FF, 0x20E7F7FF, 0x00E7F7FF});
        contrast.setBackground(gradient);
        FrameLayout.LayoutParams overlayLp = new FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT, dp(180), Gravity.TOP);
        screen.addView(contrast, overlayLp);

        LinearLayout header = new LinearLayout(this);
        header.setOrientation(LinearLayout.VERTICAL);
        header.setPadding(dp(14), statusBarHeight() + dp(8), dp(14), dp(8));
        FrameLayout.LayoutParams headerLp = new FrameLayout.LayoutParams(
            FrameLayout.LayoutParams.MATCH_PARENT, FrameLayout.LayoutParams.WRAP_CONTENT, Gravity.TOP);
        screen.addView(header, headerLp);

        LinearLayout top = new LinearLayout(this);
        top.setOrientation(LinearLayout.HORIZONTAL);
        top.setGravity(Gravity.CENTER_VERTICAL);
        header.addView(top, new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, dp(50)));

        ImageButton menu = imageAction(R.drawable.ps_menu, "Abrir menu",
            view -> showMenu(view));
        top.addView(menu, new LinearLayout.LayoutParams(dp(44), dp(44)));

        ImageView logo = new ImageView(this);
        logo.setImageResource(R.drawable.ic_launcher);
        logo.setScaleType(ImageView.ScaleType.FIT_CENTER);
        logo.setContentDescription("Logo oficial do PokeSearch");
        LinearLayout.LayoutParams logoLp = new LinearLayout.LayoutParams(dp(43), dp(43));
        logoLp.setMarginStart(dp(9));
        top.addView(logo, logoLp);

        TextView title = new TextView(this);
        title.setText("PokeSearch");
        title.setTextColor(ink());
        title.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        title.setTextSize(20);
        title.setSingleLine(true);
        title.setGravity(Gravity.CENTER_VERTICAL);
        LinearLayout.LayoutParams titleLp = new LinearLayout.LayoutParams(0, dp(48), 1);
        titleLp.setMarginStart(dp(5));
        top.addView(title, titleLp);

        top.addView(makeLoginButton(), new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.WRAP_CONTENT, dp(44)));

        LinearLayout commands = new LinearLayout(this);
        commands.setOrientation(LinearLayout.HORIZONTAL);
        commands.setGravity(Gravity.CENTER_VERTICAL | Gravity.END);
        LinearLayout.LayoutParams commandsLp = new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, dp(54));
        commandsLp.topMargin = dp(2);
        header.addView(commands, commandsLp);

        appendIcon(commands, R.drawable.ps_heart, "Fazer doação", v -> PixSupport.show(this), 7);
        appendIcon(commands, R.drawable.ps_bug, "Reportar bug", v -> showBugReport(), 7);
        appendIcon(commands, dark ? R.drawable.ps_sun : R.drawable.ps_moon,
            dark ? "Ativar modo claro" : "Ativar modo escuro", v -> toggleTheme(), 7);
        appendIcon(commands, R.drawable.ps_overlay, "Abrir overlay", v ->
            showPending("Overlay", "O overlay será conectado em uma próxima etapa. "
                + "Esta HOME não solicita permissão de sobreposição ainda."), 7);

        setContentView(screen);
    }

    private void toggleTheme() {
        dark = !dark;
        getSharedPreferences(PREF_FILE, MODE_PRIVATE)
            .edit().putBoolean(KEY_DARK, dark).apply();
        buildHome();
    }

    private void showMenu(View anchor) {
        PopupMenu menu = new PopupMenu(this, anchor);
        menu.getMenu().add(0, 1, 0, "Início");
        menu.getMenu().add(0, 2, 1, dark ? "Modo claro" : "Modo escuro");
        menu.getMenu().add(0, 3, 2, "Sobre PokeSearch");
        menu.setOnMenuItemClickListener(item -> {
            if (item.getItemId() == 1) return true;
            if (item.getItemId() == 2) { toggleTheme(); return true; }
            if (item.getItemId() == 3) {
                new AlertDialog.Builder(this).setTitle("PokeSearch")
                    .setMessage("Nova base do aplicativo. HOME com temas claro e escuro. "
                        + "Funcionalidades adicionais serão incluídas por etapas.")
                    .setPositiveButton("Fechar", null).show();
                return true;
            }
            return false;
        });
        menu.show();
    }

    private void showPending(String title, String details) {
        new AlertDialog.Builder(this).setTitle(title).setMessage(details)
            .setPositiveButton("Entendi", null).show();
    }

    private void showBugReport() {
        EditText detail = new EditText(this);
        detail.setHint("Descreva o problema ou a sugestão...");
        detail.setMinLines(3);
        detail.setMaxLines(7);
        detail.setInputType(InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_FLAG_MULTI_LINE |
            InputType.TYPE_TEXT_FLAG_CAP_SENTENCES);
        LinearLayout form = new LinearLayout(this);
        form.setPadding(dp(20), dp(5), dp(20), 0);
        form.addView(detail, new LinearLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));
        new AlertDialog.Builder(this).setTitle("Reportar bug")
            .setMessage("Seu texto só será compartilhado depois que você escolher um aplicativo.")
            .setView(form)
            .setNegativeButton("Cancelar", null)
            .setPositiveButton("Compartilhar", (dialog, which) -> {
                String message = detail.getText().toString().trim();
                if (message.isEmpty()) {
                    Toast.makeText(this, "Nenhum relato foi informado.", Toast.LENGTH_SHORT).show();
                    return;
                }
                String version = "desconhecida";
                try {
                    version = getPackageManager().getPackageInfo(getPackageName(), 0).versionName;
                } catch (Exception ignored) { }
                String body = "PokeSearch - Relatório voluntário de bug\n"
                    + "Versão: " + version + "\nAndroid: " + Build.VERSION.RELEASE
                    + "\n\nDescrição:\n" + message;
                Intent share = new Intent(Intent.ACTION_SEND);
                share.setType("text/plain");
                share.putExtra(Intent.EXTRA_SUBJECT, "PokeSearch - Reportar bug");
                share.putExtra(Intent.EXTRA_TEXT, body);
                try {
                    startActivity(Intent.createChooser(share, "Compartilhar relatório"));
                } catch (Exception ex) {
                    Toast.makeText(this, "Nenhum aplicativo disponível para compartilhar.",
                        Toast.LENGTH_LONG).show();
                }
            }).show();
    }
}
