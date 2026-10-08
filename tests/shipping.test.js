import test from 'node:test';
import assert from 'node:assert/strict';
import {packedParcel,parcelWeights,resolveDestination} from '../src/shipping.js';
const product={id:1,title:'Clay diya',category:'Craft',weight_g:500,length_cm:10,width_cm:10,height_cm:10};
const rule={divisor:5000,minimum_kg:.5,billing_increment_kg:.5};
test('measured packaging is not added twice; fragile inference includes protective space and tare',()=>{
 assert.equal(packedParcel(product).actual_kg,.5);
 const packed=packedParcel({...product,packaging_mode:'auto'});
 assert.equal(packed.estimated,true);
 assert.equal(packed.actual_kg,.8);
 assert.deepEqual(packed.dimensions_cm,[20,20,20]);
 const quote=parcelWeights([{product:{...product,packaging_mode:'auto'},qty:2}],rule);
 assert.equal(quote.actual_kg,1.6);
 assert.equal(quote.volumetric_kg,3.2);
 assert.equal(quote.chargeable_kg,4);
 assert.equal(quote.packaging_estimated,true);
});
test('compare and round each parcel so dense and bulky items cannot offset each other',()=>{
 const quote=parcelWeights([{product:{...product,weight_g:5000},qty:1},{product:{...product,weight_g:100,length_cm:50,width_cm:50,height_cm:50},qty:1}],rule);
 assert.equal(quote.actual_kg,5.1);
 assert.equal(quote.volumetric_kg,25.2);
 assert.equal(quote.chargeable_kg,30);
 const custom=parcelWeights([{product:{...product,weight_g:1100},qty:2}],{...rule,billing_increment_kg:1});
 assert.equal(custom.chargeable_kg,4);
 assert.throws(()=>packedParcel({...product,height_cm:0}),/valid weight/);
});
test('country overrides zone; missing coverage, overlapping zones and wrong card fail',()=>{
 const zone={id:1,scope:'international',international_mode:'zone',countries_json:'["India","Bhutan"]'};
 const country={id:2,scope:'international',international_mode:'country',countries_json:'["India"]'};
 assert.equal(resolveDestination([zone,country],{country:'India'}).id,2);
 assert.equal(resolveDestination([zone,country],{country:'Bhutan'}).id,1);
 assert.throws(()=>resolveDestination([zone],{country:'Canada'}),/No courier rate/);
 assert.throws(()=>resolveDestination([zone,{...zone,id:3}],{country:'India'}),/Multiple courier/);
 assert.throws(()=>resolveDestination([zone,country],{country:'India',shipping_rule_id:1}),/does not match/);
});
test('domestic district overrides province and nationwide; Valley does not cover all Bagmati',()=>{
 const global={id:1,name:'Nepal Outside Valley',scope:'domestic'};
 const valley={id:2,name:'Kathmandu Valley',scope:'domestic',province:'Bagmati Province'};
 const specific={id:3,scope:'domestic',province:'Bagmati Province',district:'Chitwan'};
 assert.equal(resolveDestination([global,valley],{country:'Nepal',province:'Bagmati Province',district:'Kathmandu'}).id,2);
 assert.equal(resolveDestination([global,valley],{country:'Nepal',province:'Bagmati Province',district:'Chitwan'}).id,1);
 assert.equal(resolveDestination([global,valley,specific],{country:'Nepal',province:'Bagmati Province',district:'Chitwan'}).id,3);
});

test('explicit delivery categories remain correct after renaming and do not cross domestic boundaries',()=>{
 const valley={id:1,name:'Valley express',scope:'domestic',delivery_category:'kathmandu_valley'};
 const outside={id:2,name:'Outside express',scope:'domestic',delivery_category:'nepal_outside_valley'};
 assert.equal(resolveDestination([valley,outside],{country:'Nepal',province:'Bagmati Province',district:'Bhaktapur'}).id,1);
 assert.equal(resolveDestination([valley,outside],{country:'Nepal',province:'Bagmati Province',district:'Chitwan'}).id,2);
 assert.throws(()=>resolveDestination([outside],{country:'Nepal',province:'Bagmati Province',district:'Kathmandu'}),/No courier rate/);
 assert.throws(()=>resolveDestination([valley,outside],{country:'Nepal',province:'Bagmati Province',district:'Kathmandu',delivery_category:'nepal_outside_valley'}),/does not match/);
});
