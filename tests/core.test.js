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
  assert.equal(boot.products.length,10);
  assert.equal(boot.occasions.length,12);
  const shipping=(await request('/quote-shipping',{items:[{product_id:1,qty:2}],zone:'Kathmandu Valley'})).data;
  assert.equal(shipping.actual_kg,.96);
  assert.equal(shipping.volumetric_kg,1.6);
  assert.equal(shipping.chargeable_kg,2);
  assert.equal(shipping.shipping,230);
  const buyer=await request('/register',{name:'Buyer',email:'buyer@test.local',password:'LongPassword123!'});
  assert.equal(buyer.status,200);
  const sellerId=boot.posts[0].author_id,postId=boot.posts[0].id;
  assert.equal((await request('/follows',{seller_id:sellerId},buyer.cookie)).data.following,true);
  assert.equal((await request('/posts/like',{post_id:postId},buyer.cookie)).data.liked,true);
  assert.equal((await request('/posts/save',{post_id:postId},buyer.cookie)).data.saved,true);
  assert.equal((await request('/posts/comment',{post_id:postId,body:'Beautiful work'},buyer.cookie)).status,201);
  assert.equal((await request('/posts/comments?post_id='+postId)).data.comments[0].body,'Beautiful work');
  assert.equal((await request('/occasions/suggest',{name:'Harvest gathering',description:'A local gathering to celebrate the harvest.'},buyer.cookie)).status,201);
  assert.equal((await request('/admin',undefined,buyer.cookie)).status,403);
  const admin=await request('/login',{email:'admin@melaa.local',password:'ChangeMe-Melaa-2026!'});
  assert.equal((await request('/admin',undefined,admin.cookie)).data.submissions[0].status,'research');
  assert.equal((await request('/admin/occasion-date',{occasion_id:1,bs_year:2083,gregorian_date:'2026-10-20',source_url:'https://example.org/evidence'},admin.cookie)).status,200);
  assert.equal((await request('/occasions/dates?occasion_id=1')).data.dates[0].bs_year,2083);
  assert.equal((await request('/checkout',{items:[{product_id:1,qty:1}],zone:'Kathmandu Valley',contribution:100},buyer.cookie)).status,422);
  const order=await request('/checkout',{items:[{product_id:1,qty:1}],zone:'Kathmandu Valley',contribution:0},buyer.cookie);
  assert.equal(order.status,201);
  assert.equal(order.data.status,'awaiting_payment');
  const seller=await request('/login',{email:'maker@melaa.local',password:'DemoSeller-2026!'});
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
	  assert.equal((await request('/conversations/message',{conversation_id:conversation.data.id,body:'Is this available in blue?'},buyer.cookie)).status,201);
	  assert.equal((await request('/conversations/messages?conversation_id='+conversation.data.id,undefined,seller.cookie)).data.messages[0].body,'Is this available in blue?');
	  assert.equal((await request('/conversations',undefined,admin.cookie)).data.conversations.length,1);
	  assert.equal((await request('/reports',{surface:'product',id:1,reason:'Suspected fake origin claim'},buyer.cookie)).status,201);
	  const pendingSeller=await request('/register',{name:'New Maker',email:'newmaker@test.local',password:'StrongPassword123',role:'seller'});
	  assert.equal(pendingSeller.data.user.seller_status,'pending');
	  const rejectedUpload=await fetch(base+'/api/media',{method:'POST',headers:{cookie:pendingSeller.cookie,'content-type':'image/png'},body:Buffer.from('89504e470d0a1a0a','hex')});
	  assert.equal(rejectedUpload.status,403);
	 }finally{
  child.kill();
  await new Promise(resolve=>child.once('close',resolve));
  rmSync(temporary,{recursive:true,force:true});
 }
});
