package com.lucianotoscano.pokesearchoverlay;

public final class PgsMissionLedgerPolicyTest {
    private static void ok(boolean value,String message) {
        if(!value)throw new AssertionError(message);
    }
    public static void main(String[] args) {
        int[] states={0,0,0,0};
        ok(PgsMissionLedgerPolicy.candies(states)==0,"GPX alone yields zero");
        ok(PgsMissionLedgerPolicy.redeem(0)==0,"cannot redeem unknown task");
        states[0]=PgsMissionLedgerPolicy.confirmTask(states[0]);
        ok(states[0]==1,"manual task confirmation");
        ok(PgsMissionLedgerPolicy.candies(states)==0,"confirmed task not a reward");
        states[0]=PgsMissionLedgerPolicy.redeem(states[0]);
        ok(states[0]==2,"manual redemption");
        ok(PgsMissionLedgerPolicy.candies(states)==25,"only redeemed candy counts");
        ok(PgsMissionLedgerPolicy.confirmTask(2)==2,"no downgrade on confirmation");
        states[1]=PgsMissionLedgerPolicy.redeem(0);
        ok(PgsMissionLedgerPolicy.candies(states)==25,"no fabricated reward");
        states[0]=PgsMissionLedgerPolicy.clear(states[0]);
        ok(PgsMissionLedgerPolicy.candies(states)==0,"reversible confirmation");
        ok(PgsMissionLedgerPolicy.normalize(-1)==0,"invalid persisted value reset");
        ok(PgsMissionLedgerPolicy.normalize(100)==0,"invalid persisted value reset");
        System.out.println("LT408 conservative manual mission ledger PASS");
    }
}
