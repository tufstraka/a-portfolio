export const WORKSHOPS = {
 fixflow: {
  title:'FixFlow / Build room', label:'Ship a safe release',
  description:'Repair a simulated delivery pipeline. Select each next operation; a failed gate must never release a bounty. No real build or payment is sent.',
  stages:[
   {prompt:'A contributor submits a patch. What runs before approval?',choices:['Release the bounty','Run the checks','Write a receipt'],correct:1,success:'Checks executed. The integration test failed.',hint:'Validate the patch before approving or paying for it.'},
   {prompt:'Integration failed. Choose a recovery path.',choices:['Bypass the failed gate','Pay and investigate later','Fix the patch and rerun checks'],correct:2,success:'Patch repaired. All checks pass.',hint:'A failed gate blocks release. Fix the issue and verify again.'},
   {prompt:'Checks pass. What authorizes the payout?',choices:['Verify the agreed acceptance criteria','Trust any green check','Ask the browser to approve itself'],correct:0,success:'Acceptance verified. The simulated payout is authorized.',hint:'A green build alone does not prove the bounty acceptance criteria were met.'},
   {prompt:'The payout is confirmed. Close the workflow.',choices:['Repeat the payment','Record a unique receipt','Delete the build history'],correct:1,success:'Receipt recorded. Release complete, with an auditable trail.',hint:'Keep a unique record so retries cannot duplicate a payment.'}
  ]
 },
 security: {
  title:'Security / Request lab',label:'Guard the API',
  description:'Inspect incoming requests and decide whether to allow or block them. Identity, ownership and permission all matter.',
  stages:[
   {prompt:'GET /invoices/42 · Signed in as Ada · Invoice owner: Ada · Read permission: yes',choices:['Allow request','Block request'],correct:0,success:'Allowed. Identity, ownership and permission match.',hint:'This authenticated user owns the resource and has read permission.'},
   {prompt:'GET /invoices/43 · Signed in as Ada · Invoice owner: Ben · Shared access: no',choices:['Allow request','Block request'],correct:1,success:'Blocked. Changing an ID must not expose another account’s data.',hint:'Being signed in does not grant access to another user’s invoice.'},
   {prompt:'DELETE /invoices/42 · Signed in as Ada · Invoice owner: Ada · Role: read-only',choices:['Allow request','Block request'],correct:1,success:'Blocked. Ownership does not grant delete permission.',hint:'Check the permission for this specific operation, not just ownership.'},
   {prompt:'GET /invoices/42 · Session revoked · Browser still shows “signed in”',choices:['Allow request','Block request'],correct:1,success:'Blocked. The server rejected the revoked session.',hint:'Browser state is not authority. Validate the session on the server.'}
  ]
 }
};
export class WorkshopRun {
 constructor(id){if(!WORKSHOPS[id])throw new Error('Unknown workshop');this.id=id;this.index=0;this.mistakes=0;this.completed=false;}
 get stage(){return WORKSHOPS[this.id].stages[this.index];}
 choose(index){if(this.completed)return {complete:true,correct:true};if(!Number.isInteger(index)||index<0||index>=this.stage.choices.length)return {correct:false};if(index!==this.stage.correct){this.mistakes++;return {correct:false,message:this.stage.hint};}const message=this.stage.success;this.index++;this.completed=this.index===WORKSHOPS[this.id].stages.length;return {correct:true,complete:this.completed,message};}
}
