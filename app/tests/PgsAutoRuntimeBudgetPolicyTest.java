package com.lucianotoscano.pokesearchoverlay;
public final class PgsAutoRuntimeBudgetPolicyTest {
    static void check(boolean pass,String reason){if(!pass)throw new AssertionError(reason);}
    public static void main(String[] args){
        check(PgsAutoRuntimeBudgetPolicy.mayVerify(0,0,0,0),"one model eligible");
        check(PgsAutoRuntimeBudgetPolicy.mayVerify(11,63,11,63),"within active budget");
        check(!PgsAutoRuntimeBudgetPolicy.mayVerify(0,0,12,0),"species cap");
        check(!PgsAutoRuntimeBudgetPolicy.mayVerify(20,0,0,0),"per species attempts cap");
        check(!PgsAutoRuntimeBudgetPolicy.mayVerify(0,100,0,0),"global validation cap");
        check(!PgsAutoRuntimeBudgetPolicy.mayVerify(0,0,0,64),"global active cap");
        System.out.println("LT357 native memory/validation budgets 6/6 PASS");
    }
}
