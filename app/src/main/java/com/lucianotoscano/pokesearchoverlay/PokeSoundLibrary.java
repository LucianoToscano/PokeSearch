package com.lucianotoscano.pokesearchoverlay;

import android.content.Context;
import android.net.Uri;

/** User-supplied audio. Static R.raw references preserve MP3s in minified builds. */
final class PokeSoundLibrary {
    // Display labels; indexes stay aligned with the 36 curated sounds (Drive SoundPokemon verified 2026-10-23).
    static final String[] LABELS={
        "Pokémon capturado",
        "Pokémon recuperado",
        "Item recebido",
        "Aipom · Grito",
        "Acerto",
        "Dexter · Meme",
        "Glaceon · Grito",
        "Jigglypuff · Evolução meme",
        "É o Pikachu!",
        "Magikarp · Salto",
        "Vitória · Efeito",
        "Pikachu · Grito",
        "Pikachu · Feliz",
        "Pikachu · Clássico",
        "Tema Pokémon",
        "Batalha Pokémon",
        "Evolução Pokémon",
        "Alerta Pokémon",
        "Vitória · Jogo clássico",
        "Item encontrado",
        "Quem é esse Pokémon? · BR",
        "Pokémon brilhante · Shiny",
        "Pokémon saindo da bola",
        "Quem é esse Pokémon? · EN",
        "Snorlax",
        "Wobbuffet",
        "Gardevoir",
        "Bulbasaur",
        "Equipe Rocket",
        "Mew",
        "Charmander",
        "Pikachu · Choque",
        "Ditto · Triste",
        "Togepi",
        "Squirtle",
        "Jigglypuff"
    };
    private static final int[] AUDIO={
        R.raw.ps_06_caught_a_pokemon,
        R.raw.ps_111_pokemon_recovery,
        R.raw.ps_129_received_an_item,
        R.raw.ps_aipom,
        R.raw.ps_correct,
        R.raw.ps_dexter_meme,
        R.raw.ps_freesound_community_glaceon_cry_39075,
        R.raw.ps_jigglypuff_evolucao_meme,
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
        R.raw.ps_whos_that_pokemon,
        R.raw.ps_snorlax,
        R.raw.ps_wobbuffet,
        R.raw.ps_gardevoir,
        R.raw.ps_bulbasaur,
        R.raw.ps_equipe_rocket,
        R.raw.ps_mew,
        R.raw.ps_charmander,
        R.raw.ps_pikachu_choque,
        R.raw.ps_ditto_triste,
        R.raw.ps_togepi,
        R.raw.ps_squirtle,
        R.raw.ps_jigglypuff
    };
    // The audio is already bundled. New installations use this BR clip only
    // for favorites; existing user selections always take precedence.
    static Uri favoriteDefaultUri(Context context){
        return Uri.parse("android.resource://"+context.getPackageName()+"/raw/"+
            context.getResources().getResourceEntryName(R.raw.ps_quem_e_esse_pokemon_011));
    }
    static int size(){return LABELS.length;}
    static Uri soundUri(Context context,int selection){
        if(selection<0||selection>=AUDIO.length)return null;
        return Uri.parse("android.resource://"+context.getPackageName()+"/raw/"+
            context.getResources().getResourceEntryName(AUDIO[selection]));
    }
    private PokeSoundLibrary(){}
}
