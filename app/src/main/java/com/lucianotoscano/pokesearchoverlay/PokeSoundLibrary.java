package com.lucianotoscano.pokesearchoverlay;

import android.content.Context;
import android.net.Uri;

/** User-supplied audio. Static R.raw references preserve MP3s in minified builds. */
final class PokeSoundLibrary {
    static final String[] LABELS={
        "06 caught a pokemon",
        "111 pokemon recovery",
        "129 received an item",
        "aipom",
        "correct",
        "dexter meme",
        "freesound community glaceon cry 39075",
        "freesound community weird pikachu 101090",
        "its pikachu short",
        "magikarp jump",
        "mori sound fx game winner 497166",
        "pika cry",
        "pikachu happy",
        "pikachu scream",
        "pkmntheme",
        "pokemon battle",
        "pokemon evolve",
        "pokemon exclamation mark sound effect",
        "pokemon red blue music wild pokemon victory theme 1",
        "pokemon red blue yellow item found sound effect",
        "quem e esse pokemon 011",
        "shiny pokemon",
        "sound effects pokemon anime 7 pokemon out",
        "whos that pokemon "
    };
    private static final int[] AUDIO={
        R.raw.ps_06_caught_a_pokemon,
        R.raw.ps_111_pokemon_recovery,
        R.raw.ps_129_received_an_item,
        R.raw.ps_aipom,
        R.raw.ps_correct,
        R.raw.ps_dexter_meme,
        R.raw.ps_freesound_community_glaceon_cry_39075,
        R.raw.ps_freesound_community_weird_pikachu_101090,
        R.raw.ps_its_pikachu_short,
        R.raw.ps_magikarp_jump,
        R.raw.ps_mori_sound_fx_game_winner_497166,
        R.raw.ps_pika_cry,
        R.raw.ps_pikachu_happy,
        R.raw.ps_pikachu_scream,
        R.raw.ps_pkmntheme,
        R.raw.ps_pokemon_battle,
        R.raw.ps_pokemon_evolve,
        R.raw.ps_pokemon_exclamation_mark_sound_effect,
        R.raw.ps_pokemon_red_blue_music_wild_pokemon_victory_theme_1,
        R.raw.ps_pokemon_red_blue_yellow_item_found_sound_effect,
        R.raw.ps_quem_e_esse_pokemon_011,
        R.raw.ps_shiny_pokemon,
        R.raw.ps_sound_effects_pokemon_anime_7_pokemon_out,
        R.raw.ps_whos_that_pokemon
    };
    static int size(){return LABELS.length;}
    static Uri soundUri(Context context,int selection){
        if(selection<0||selection>=AUDIO.length)return null;
        return Uri.parse("android.resource://"+context.getPackageName()+"/raw/"+
            context.getResources().getResourceEntryName(AUDIO[selection]));
    }
    private PokeSoundLibrary(){}
}
