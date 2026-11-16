package com.lucianotoscano.pokesearchoverlay;
public final class PgsNightSupervisorPolicyTest {
  static void yes(boolean value,String msg){if(!value)throw new AssertionError(msg);}
  static void eq(PgsNightSupervisorPolicy.Decision expected,
      PgsNightSupervisorPolicy.Decision actual,String msg){
    if(expected!=actual)throw new AssertionError(msg+": "+actual);
  }
  public static void main(String[] args){
    yes(PgsNightSupervisorPolicy.canStart("pgsharp",true,false,true,false),
      "allow explicitly prepared PGSharp");
    yes(!PgsNightSupervisorPolicy.canStart("pokemod",true,false,true,false),
      "no unverified Pokemod autopilot");
    yes(!PgsNightSupervisorPolicy.canStart("pgsharp",true,true,true,false),
      "safety notice");
    yes(!PgsNightSupervisorPolicy.canStart("pgsharp",true,false,false,false),
      "notifications required");
    yes(!PgsNightSupervisorPolicy.canStart("pgsharp",false,false,true,false),
      "foreground required");
    yes(!PgsNightSupervisorPolicy.canStart("pgsharp",true,false,true,true),
      "never race another engine");
    eq(PgsNightSupervisorPolicy.Decision.KEEP,
      PgsNightSupervisorPolicy.check("pgsharp","pgsharp",true,false,false,0),
      "normal heartbeat");
    eq(PgsNightSupervisorPolicy.Decision.KEEP,
      PgsNightSupervisorPolicy.check("pgsharp","pgsharp",false,false,false,1),
      "one missed sample");
    eq(PgsNightSupervisorPolicy.Decision.STOP_GAME_MISSING,
      PgsNightSupervisorPolicy.check("pgsharp","pgsharp",false,false,false,2),
      "two missed samples");
    eq(PgsNightSupervisorPolicy.Decision.STOP_PROFILE,
      PgsNightSupervisorPolicy.check("pgsharp","pokemod",true,false,false,0),
      "profile changed");
    eq(PgsNightSupervisorPolicy.Decision.STOP_SAFETY,
      PgsNightSupervisorPolicy.check("pgsharp","pgsharp",true,true,false,0),
      "safety notice");
    eq(PgsNightSupervisorPolicy.Decision.STOP_ENGINE,
      PgsNightSupervisorPolicy.check("pgsharp","pgsharp",true,false,true,0),
      "another engine");
    eq(PgsNightSupervisorPolicy.Decision.STOP_NOTIFICATIONS,
      PgsNightSupervisorPolicy.check("pgsharp","pgsharp",true,false,false,0,false),
      "permission revoked after start");
    System.out.println("LT372 night supervisor policy 13/13 PASS");
  }
}
