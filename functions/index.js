"use strict";
// Code-only backend candidate. Do not deploy without project owner approval.
const {onValueCreated,onValueDeleted}=require("firebase-functions/v2/database");
const {initializeApp,getApps}=require("firebase-admin/app");
const {getDatabase}=require("firebase-admin/database");
if(!getApps().length)initializeApp();
const OPTIONS={instance:"pokesearch-lt-default-rtdb",region:"us-central1"};
async function incrementAggregate(name,delta){
    await getDatabase().ref("stats/public/"+name).transaction(value=>
        Math.max(0,(Number.isSafeInteger(value)&&value>=0?value:0)+delta),
        undefined,false);
}
exports.onInstallationAdded=onValueCreated({...OPTIONS,ref:"/stats/installations/{uid}"},
    async ()=>incrementAggregate("installCount",1));
exports.onInstallationRemoved=onValueDeleted({...OPTIONS,ref:"/stats/installations/{uid}"},
    async ()=>incrementAggregate("installCount",-1));
exports.onPresenceAdded=onValueCreated({...OPTIONS,ref:"/stats/online/{uid}"},
    async ()=>incrementAggregate("onlineCount",1));
exports.onPresenceRemoved=onValueDeleted({...OPTIONS,ref:"/stats/online/{uid}"},
    async ()=>incrementAggregate("onlineCount",-1));
