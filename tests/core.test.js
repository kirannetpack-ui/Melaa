import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const temporary=mkdtempSync(path.join(tmpdir(),'melaa-test-'));
const port=43000+Math.floor(Math.random()*10000);
const base=`http://127.0.0.1:${port}`;
const child=spawn(process.execPath,['server.js'],{cwd:root,env:{...process.env,PORT:String(port),MELAA_DB_PATH:path.join(temporary,'test.sqlite'),MELAA_UPLOADS_PATH:path.join(temporary,'uploads')},stdio:'ignore'});
async function ready(){for(let i=0;i<100;i++){try{const r=await fetch(base+'/api/bootstrap');if(r.ok)return}catch{}await new Promise(r=>setTimeout(r,40))}throw Error('Server failed to start')}
async function request(route,body,cookie){const response=await fetch(base+'/api'+route,{method:body?'POST':'GET',headers:{...(body?{'content-type':'application/json'}:{}),...(cookie?{cookie}:{})},body:body?JSON.stringify(body):undefined});return {status:response.status,data:await response.json(),cookie:response.headers.get('set-cookie')?.split(';')[0]}}

test('social, commerce, research, and contribution gates',async()=>{
 try{
  await ready();
  const boot=(await request('/bootstrap')).data;
  assert.match(boot.seller_terms.clauses[0],/mutually agree in writing/);
  assert.doesNotMatch(boot.seller_terms.clauses[0],/5%|3%/);
  assert.equal(boot.commerce.commission_percent,5);
  assert.equal(boot.commerce.wholesale_commission_percent,3);
  assert.equal(boot.products.length,10);
  assert.equal(boot.occasions.length,12);
  const shipping=(await request('/quote-shipping',{items:[{product_id:1,qty:2}],zone:'Kathmandu Valley'})).data;
  assert.equal(shipping.actual_kg,.96);
  assert.equal(shipping.volumetric_kg,1.6);
  assert.equal(shipping.chargeable_kg,2);
  assert.equal(shipping.shipping,230);
  const buyer=await request('/register',{name:'Buyer',email:'buyer@test.local',password:'LongPassword123!'});
  assert.equal(buyer.status,200);
  const phoneBuyer=await request('/register',{name:'Phone Buyer',contact:'+977 9812345678',password:'a memorable long passphrase'});
  assert.equal(phoneBuyer.status,200);
  assert.equal(phoneBuyer.data.user.email,null);
  assert.equal(phoneBuyer.data.user.phone_e164,'+9779812345678');
  assert.equal((await request('/login',{contact:'+977-9812345678',password:'a memorable long passphrase'})).status,200);
  assert.equal((await request('/register',{name:'Duplicate Phone',contact:'+9779812345678',password:'another long passphrase'})).status,409);
  assert.equal((await request('/register',{name:'Invalid Phone',contact:'9812345678',password:'another long passphrase'})).status,400);
  assert.equal((await request('/register',{name:'Short Password',contact:'short@test.local',password:'short-pass'})).status,400);
  const sellerId=boot.posts[0].author_id,postId=boot.posts[0].id;
  assert.equal((await request('/follows',{seller_id:sellerId},buyer.cookie)).data.following,true);
  assert.equal((await request('/posts/like',{post_id:postId},buyer.cookie)).data.liked,true);
  assert.equal((await request('/posts/save',{post_id:postId},buyer.cookie)).data.saved,true);
  const feed=(await request('/feed?limit=2&offset=0&q=Dhaka',undefined,buyer.cookie)).data;
  assert.equal(feed.posts.length,2);
  assert.equal(feed.has_more,true);
  assert.ok(feed.posts.some(item=>item.caption.toLowerCase().includes('dhaka')));
  assert.equal((await request('/posts/recommend',{post_id:postId},buyer.cookie)).data.recommended,true);
  assert.equal((await request('/feed?limit=8',undefined,buyer.cookie)).data.posts.find(item=>item.id===postId).recommendations,1);
  const suggestion=await request('/posts/suggest',{post_id:postId,kind:'customization',body:'Could you make this in a smaller size?'},buyer.cookie);
  assert.equal(suggestion.status,201);
  assert.equal((await request('/posts/comment',{post_id:postId,body:'Beautiful work'},buyer.cookie)).status,201);
  assert.equal((await request('/posts/comments?post_id='+postId)).data.comments[0].body,'Beautiful work');
  assert.equal((await request('/occasions/suggest',{name:'Harvest gathering',description:'A local gathering to celebrate the harvest.'},buyer.cookie)).status,201);
  assert.equal((await request('/admin',undefined,buyer.cookie)).status,403);
  const admin=await request('/login',{email:'admin@melaa.local',password:'ChangeMe-Melaa-2026!'});
  assert.ok((await request('/me',undefined,admin.cookie)).data.suggestions.some(item=>item.id===suggestion.data.id));
  assert.equal((await request('/admin',undefined,admin.cookie)).data.submissions[0].status,'research');
  const futureDate=new Date(Date.now()+30*86400000).toISOString().slice(0,10);
  assert.equal((await request('/admin/occasion-date',{occasion_id:1,bs_year:2083,gregorian_date:futureDate,source_url:'https://example.org/evidence'},admin.cookie)).status,200);
  assert.equal((await request('/occasions/dates?occasion_id=1')).data.dates[0].bs_year,2083);
  const reminders=(await request('/reminders',undefined,buyer.cookie)).data;
  assert.equal(reminders.delivery,'in_app_only');
  assert.ok(reminders.reviewed.some(item=>item.title==='Dashain'));
  assert.equal((await request('/checkout',{items:[{product_id:1,qty:1}],zone:'Kathmandu Valley',contribution:100},buyer.cookie)).status,422);
  const order=await request('/checkout',{items:[{product_id:1,qty:1}],zone:'Kathmandu Valley',contribution:0},buyer.cookie);
  assert.equal(order.status,201);
  assert.equal(order.data.status,'awaiting_payment');
  assert.equal(order.data.commission_percent,5);
  const seller=await request('/login',{email:'maker@melaa.local',password:'DemoSeller-2026!'});
  assert.equal((await request('/quotes',{product_id:1,qty:2,destination:'Kathmandu'},buyer.cookie)).status,400);
  assert.equal((await request('/quotes',{product_id:1,qty:10,destination:'Kathmandu',note:'Blue shawls preferred'},buyer.cookie)).status,201);
  assert.equal((await request('/me',undefined,seller.cookie)).data.quotes_received[0].qty,10);
  const mediaResponse=await fetch(base+'/api/media',{method:'POST',headers:{cookie:seller.cookie,'content-type':'image/png'},body:Buffer.from('89504e470d0a1a0a','hex')});
  assert.equal(mediaResponse.status,201);
	  const media=await mediaResponse.json();
	  assert.match(media.url,/^\/uploads\/.+\.png$/);
	  assert.equal((await fetch(base+media.url)).status,404);
	  assert.equal((await fetch(base+media.url,{headers:{cookie:seller.cookie}})).status,200);
	  const createdPost=await request('/posts',{caption:'A newly uploaded studio story',product_id:1,occasion_id:1,media_url:media.url,media_type:'image'},seller.cookie);
	  assert.equal(createdPost.status,201);
	  assert.equal(createdPost.data.status,'review');
	  assert.notEqual((await request('/bootstrap')).data.posts[0].media_url,media.url);
	  assert.equal((await request('/admin/review',{entity:'post',id:createdPost.data.id,decision:'approve'},admin.cookie)).status,200);
	  assert.equal((await fetch(base+media.url)).status,200);
	  const updatedBoot=(await request('/bootstrap')).data;
	  assert.equal(updatedBoot.posts[0].media_url,media.url);
	  assert.ok(updatedBoot.categories.length>=50);
	  assert.ok(updatedBoot.commodities.length>=30);
	  const categoryProposal=await request('/categories/propose',{name:'Regional weaving tools',group_name:'Craft, fashion & home',description:'Tools and accessories used by traceable regional weaving workshops.',source_url:'https://example.org/source'},buyer.cookie);
	  assert.equal(categoryProposal.data.status,'review');
	  assert.equal((await request('/admin/review',{entity:'category',id:categoryProposal.data.id,decision:'approve'},admin.cookie)).status,200);
	  const conversation=await request('/conversations/start',{product_id:1},buyer.cookie);
	  assert.equal(conversation.status,200);
	  assert.equal((await request('/conversations/message',{conversation_id:conversation.data.id,body:'Can I pay you directly on WhatsApp?'},buyer.cookie)).status,422);
	  assert.equal((await request('/conversations/message',{conversation_id:conversation.data.id,body:'Find me on Whats\u200bApp'},buyer.cookie)).status,422);
	  assert.equal((await request('/conversations/message',{conversation_id:conversation.data.id,body:'Is this available in blue?'},buyer.cookie)).status,201);
	  assert.equal((await request('/conversations',undefined,seller.cookie)).data.conversations[0].unread,1);
	  assert.equal((await request('/conversations/messages?conversation_id='+conversation.data.id,undefined,seller.cookie)).data.messages[0].body,'Is this available in blue?');
	  assert.equal((await request('/conversations',undefined,seller.cookie)).data.conversations[0].unread,0);
	  assert.equal((await request('/conversations/report',{conversation_id:conversation.data.id,message_id:1,reason:'This message needs review'},seller.cookie)).status,201);
	  const adminQueue=(await request('/admin',undefined,admin.cookie)).data.moderation;
	  const chatReport=adminQueue.find(item=>item.surface==='conversation'&&item.action==='queued');
	  assert.ok(chatReport);
	  assert.equal((await request('/conversations',undefined,admin.cookie)).data.conversations[0].flags,1);
	  assert.equal((await request('/admin/moderation',{id:chatReport.id,action:'resolved'},admin.cookie)).status,200);
	  assert.equal((await request('/admin',undefined,admin.cookie)).data.moderation.find(item=>item.id===chatReport.id).action,'resolved');
	  assert.equal((await request('/conversations',undefined,admin.cookie)).data.conversations.length,1);
	  assert.equal((await request('/reports',{surface:'product',id:1,reason:'Suspected fake origin claim'},buyer.cookie)).status,201);
  assert.equal((await request('/register',{name:'New Maker',email:'newmaker@test.local',password:'StrongPassword123',role:'seller'})).status,400);
  const pendingSeller=await request('/register',{name:'New Maker',email:'newmaker@test.local',password:'StrongPassword123',role:'seller',accept_seller_terms:true,seller_terms_version:boot.seller_terms.version});
  assert.equal(pendingSeller.data.user.seller_status,'pending');
  assert.equal(pendingSeller.data.user.accepted_terms_version,boot.seller_terms.version);
  const rejectedUpload=await fetch(base+'/api/media',{method:'POST',headers:{cookie:pendingSeller.cookie,'content-type':'image/png'},body:Buffer.from('89504e470d0a1a0a','hex')});
  assert.equal(rejectedUpload.status,403);
  const shippingRule=await request('/admin/shipping-rules',{name:'Koshi — Jhapa test',scope:'domestic',province:'Koshi Province',district:'Jhapa',countries:[],bands:[{from_kg:0,to_kg:.5,kind:'flat',amount_npr:100},{from_kg:.5,to_kg:10,kind:'flat',amount_npr:300}],over_10_per_kg:40,charges:[{name:'Remote handling',above_kg:10,kind:'flat',amount_npr:75}],divisor:5000,minimum_kg:.5},admin.cookie);
  assert.equal(shippingRule.status,200);
  const rateCard=(await request('/bootstrap')).data.shipping_rules.find(item=>item.name==='Koshi — Jhapa test');
  assert.equal(rateCard.district,'Jhapa');
  const overTen=await request('/quote-shipping',{items:[{product_id:1,qty:25}],shipping_rule_id:rateCard.id});
  assert.equal(overTen.status,200);
  assert.ok(overTen.data.breakdown.some(item=>item.name==='Remote handling'));
  assert.equal((await request('/admin/settings',{retail_commission_percent:5,wholesale_commission_percent:2},admin.cookie)).status,200);
  const revisedTerms=(await request('/bootstrap')).data.seller_terms;
  assert.equal(revisedTerms.version,boot.seller_terms.version);
  const staleSellerUpload=await fetch(base+'/api/media',{method:'POST',headers:{cookie:seller.cookie,'content-type':'image/png'},body:Buffer.from('89504e470d0a1a0a','hex')});
  assert.equal(staleSellerUpload.status,201);
  assert.equal((await request('/seller-terms/accept',{version:revisedTerms.version,accept:true},seller.cookie)).status,200);
  assert.equal((await request('/me',undefined,seller.cookie)).data.user.accepted_terms_version,revisedTerms.version);
	 }finally{
  child.kill();
  await new Promise(resolve=>child.once('close',resolve));
  rmSync(temporary,{recursive:true,force:true});
 }
});

test('production seed keeps catalog but omits demo seller inventory',async()=>{
 const folder=mkdtempSync(path.join(tmpdir(),'melaa-prod-test-'));
 const productionPort=53000+Math.floor(Math.random()*8000);
 const productionBase=`http://127.0.0.1:${productionPort}`;
 const production=spawn(process.execPath,['server.js'],{cwd:root,env:{...process.env,NODE_ENV:'production',VERCEL:'',PORT:String(productionPort),MELAA_ADMIN_PASSWORD:'UniqueTestPassword123!',MELAA_ENABLE_PUBLIC_DEMO:'1',MELAA_DB_PATH:path.join(folder,'production.sqlite'),MELAA_UPLOADS_PATH:path.join(folder,'uploads')},stdio:'ignore'});
 try{
  let response;
  for(let attempt=0;attempt<100;attempt++){
   try{response=await fetch(productionBase+'/api/bootstrap');if(response.ok)break}catch{}
   await new Promise(resolve=>setTimeout(resolve,40));
  }
  assert.equal(response?.status,200);
  const data=await response.json();
  assert.equal(data.categories.length,58);
  assert.equal(data.commodities.length,39);
  assert.equal(data.products.length,0);
  assert.equal(data.posts.length,0);
  assert.equal(data.demo_available,true);
  for(const [email,password,role] of [['buyer@melaa.local','DemoBuyer-2026!','buyer'],['maker@melaa.local','DemoSeller-2026!','seller']]){
   const response=await fetch(productionBase+'/api/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email,password})});
   assert.equal(response.status,200);
   const body=await response.json();
   assert.equal(body.user.role,role);
   assert.equal(body.user.is_demo,1);
   const cookie=response.headers.get('set-cookie').split(';')[0];
   const own=await fetch(productionBase+'/api/me',{headers:{cookie}});
   assert.equal(own.status,200);
   assert.equal((await own.json()).user.is_demo,1);
   assert.equal((await fetch(productionBase+'/api/admin',{headers:{cookie}})).status,403);
   assert.equal((await fetch(productionBase+'/api/events',{method:'POST',headers:{cookie,'content-type':'application/json'},body:'{}'})).status,403);
   assert.equal((await fetch(productionBase+'/api/posts',{method:'POST',headers:{cookie,'content-type':'application/json'},body:'{}'})).status,403);
  }
  const login=await fetch(productionBase+'/api/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:'admin@melaa.local',password:'UniqueTestPassword123!'})});
  assert.equal(login.status,200);
  assert.match(login.headers.get('set-cookie'),/; Secure/);
 }finally{
  if(production.exitCode===null){production.kill();await new Promise(resolve=>production.once('close',resolve));}
  rmSync(folder,{recursive:true,force:true});
 }
});
