package com.lucianotoscano.pokesearchoverlay;

import android.app.Activity;
import android.graphics.Color;
import android.os.Bundle;
import android.view.View;

/** Etapa zero: atividade completamente vazia. Sem overlay, rede, WebView ou controles. */
public final class MainActivity extends Activity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        View emptyScreen = new View(this);
        emptyScreen.setBackgroundColor(Color.BLACK);
        setContentView(emptyScreen);
    }
}
