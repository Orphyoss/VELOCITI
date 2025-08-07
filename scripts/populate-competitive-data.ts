#!/usr/bin/env tsx
/**
 * Populate competitive pricing data from sample infare_webfare_fact data
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { competitivePricing, routeMarkets } from '../shared/schema';

const client = postgres(process.env.DEV_DATABASE_URL || process.env.DATABASE_URL!);
const db = drizzle(client);

// Sample data from the provided infare_webfare_fact table
const sampleCompetitiveData = [
  {
    marketKey: 274, snapshotDateKey: 1872, dptrDateKey: 20260711, dptrTimeKey: 4081,
    outbndBookingClassCd: 'M', outbndFareBasis: 'YAP21', observationTmKey: 1418, outbndFltNbr: 9586,
    priceExclTaxAmt: 848.48, priceInclTaxAmt: 610.82, taxAmt: 116.68, currencyKey: 1,
    carrKey: 999, carrAirlineCode: 'TL', carrAirlineName: 'Telos Airlines',
    priceOutbndAmt: 405.59, priceInbndAmt: 1288.52, isTaxInclFlg: 'dummy_IS_TAX_INCL_FLG_0',
    searchClass: 'PREMIUM_ECONOMY', estimatedCos: 'dummy_ESTIMATED_COS_0', saverSellup: 122.3,
    expectedFareBasis: '["BAP21"]', saverPrice: 140.89, mainPrice: 1233.56, fltNbr: 232
  },
  {
    marketKey: 274, snapshotDateKey: 1870, dptrDateKey: 20260526, dptrTimeKey: 6174,
    outbndBookingClassCd: 'Q', outbndFareBasis: 'YAP21', observationTmKey: 2038, outbndFltNbr: 4273,
    priceExclTaxAmt: 211.39, priceInclTaxAmt: 338.47, taxAmt: 23.93, currencyKey: 1,
    carrKey: 108, carrAirlineCode: 'F9', carrAirlineName: 'Frontier Airlines',
    priceOutbndAmt: 1203.07, priceInbndAmt: 1217.48, isTaxInclFlg: 'dummy_IS_TAX_INCL_FLG_1',
    searchClass: 'PREMIUM_ECONOMY', estimatedCos: 'dummy_ESTIMATED_COS_1', saverSellup: 46.72,
    expectedFareBasis: '["QAP21"]', saverPrice: 104.45, mainPrice: 701.67, fltNbr: 5239
  },
  {
    marketKey: 306, snapshotDateKey: 2140, dptrDateKey: 20250928, dptrTimeKey: 9155,
    outbndBookingClassCd: 'F', outbndFareBasis: 'YAP21', observationTmKey: 8544, outbndFltNbr: 3295,
    priceExclTaxAmt: 418.41, priceInclTaxAmt: 940.64, taxAmt: 73.56, currencyKey: 1,
    carrKey: 108, carrAirlineCode: 'F9', carrAirlineName: 'Frontier Airlines',
    priceOutbndAmt: 172.48, priceInbndAmt: 1281.78, isTaxInclFlg: 'dummy_IS_TAX_INCL_FLG_8',
    searchClass: 'BUSINESS', estimatedCos: 'dummy_ESTIMATED_COS_8', saverSellup: 32.47,
    expectedFareBasis: '["QAP21","MAP21","HAP21"]', saverPrice: 23.86, mainPrice: 1006.15, fltNbr: 7801
  },
  {
    marketKey: 306, snapshotDateKey: 1897, dptrDateKey: 20260602, dptrTimeKey: 5710,
    outbndBookingClassCd: 'J', outbndFareBasis: 'WAP21', observationTmKey: 6479, outbndFltNbr: 8953,
    priceExclTaxAmt: 1073.10, priceInclTaxAmt: 97.44, taxAmt: 87.82, currencyKey: 1,
    carrKey: 102, carrAirlineCode: 'DL', carrAirlineName: 'Delta Air Lines',
    priceOutbndAmt: 256.69, priceInbndAmt: 1012.30, isTaxInclFlg: 'dummy_IS_TAX_INCL_FLG_9',
    searchClass: 'FIRST', estimatedCos: 'dummy_ESTIMATED_COS_9', saverSellup: 55.09,
    expectedFareBasis: '["MAP21"]', saverPrice: 118.78, mainPrice: 538.57, fltNbr: 454
  },
  {
    marketKey: 419, snapshotDateKey: 1936, dptrDateKey: 20260713, dptrTimeKey: 9431,
    outbndBookingClassCd: 'B', outbndFareBasis: 'HAP21', observationTmKey: 1158, outbndFltNbr: 6367,
    priceExclTaxAmt: 929.83, priceInclTaxAmt: 349.47, taxAmt: 27.64, currencyKey: 1,
    carrKey: 103, carrAirlineCode: 'UA', carrAirlineName: 'United Airlines',
    priceOutbndAmt: 627.96, priceInbndAmt: 690.46, isTaxInclFlg: 'dummy_IS_TAX_INCL_FLG_16',
    searchClass: 'BUSINESS', estimatedCos: 'dummy_ESTIMATED_COS_16', saverSellup: 20.27,
    expectedFareBasis: '["HAP21","MAP21"]', saverPrice: 131.36, mainPrice: 608.64, fltNbr: 2235
  },
  {
    marketKey: 345, snapshotDateKey: 1844, dptrDateKey: 20260412, dptrTimeKey: 1813,
    outbndBookingClassCd: 'W', outbndFareBasis: 'WAP21', observationTmKey: 4044, outbndFltNbr: 4775,
    priceExclTaxAmt: 187.57, priceInclTaxAmt: 549.23, taxAmt: 83.52, currencyKey: 1,
    carrKey: 104, carrAirlineCode: 'WN', carrAirlineName: 'Southwest Airlines',
    priceOutbndAmt: 731.05, priceInbndAmt: 1211.24, isTaxInclFlg: 'dummy_IS_TAX_INCL_FLG_24',
    searchClass: 'FIRST', estimatedCos: 'dummy_ESTIMATED_COS_24', saverSellup: 114.26,
    expectedFareBasis: '["QAP21"]', saverPrice: 191.88, mainPrice: 676.17, fltNbr: 8819
  },
  {
    marketKey: 461, snapshotDateKey: 1773, dptrDateKey: 20260316, dptrTimeKey: 4763,
    outbndBookingClassCd: 'J', outbndFareBasis: 'YAP21', observationTmKey: 3672, outbndFltNbr: 3417,
    priceExclTaxAmt: 107.24, priceInclTaxAmt: 417.05, taxAmt: 87.44, currencyKey: 1,
    carrKey: 101, carrAirlineCode: 'AA', carrAirlineName: 'American Airlines',
    priceOutbndAmt: 780.62, priceInbndAmt: 987.06, isTaxInclFlg: 'dummy_IS_TAX_INCL_FLG_32',
    searchClass: 'PREMIUM_ECONOMY', estimatedCos: 'dummy_ESTIMATED_COS_32', saverSellup: 65.71,
    expectedFareBasis: '["MAP21","HAP21"]', saverPrice: 170.92, mainPrice: 1120.17, fltNbr: 2329
  },
  {
    marketKey: 369, snapshotDateKey: 1963, dptrDateKey: 20260215, dptrTimeKey: 8031,
    outbndBookingClassCd: 'V', outbndFareBasis: 'BAP21', observationTmKey: 5328, outbndFltNbr: 428,
    priceExclTaxAmt: 283.44, priceInclTaxAmt: 928.41, taxAmt: 79.58, currencyKey: 1,
    carrKey: 108, carrAirlineCode: 'F9', carrAirlineName: 'Frontier Airlines',
    priceOutbndAmt: 451.47, priceInbndAmt: 1044.68, isTaxInclFlg: 'dummy_IS_TAX_INCL_FLG_40',
    searchClass: 'BUSINESS', estimatedCos: 'dummy_ESTIMATED_COS_40', saverSellup: 141.5,
    expectedFareBasis: '["HAP21"]', saverPrice: 138.44, mainPrice: 856.33, fltNbr: 5020
  },
  // Add EasyJet data as competitor reference
  {
    marketKey: 274, snapshotDateKey: 1875, dptrDateKey: 20260612, dptrTimeKey: 1430,
    outbndBookingClassCd: 'Y', outbndFareBasis: 'FLEX', observationTmKey: 1430, outbndFltNbr: 8912,
    priceExclTaxAmt: 156.50, priceInclTaxAmt: 185.20, taxAmt: 28.70, currencyKey: 1,
    carrKey: 200, carrAirlineCode: 'U2', carrAirlineName: 'easyJet',
    priceOutbndAmt: 156.50, priceInbndAmt: 0, isTaxInclFlg: 'Y',
    searchClass: 'ECONOMY', estimatedCos: 'STANDARD', saverSellup: 15.20,
    expectedFareBasis: '["FLEX"]', saverPrice: 132.40, mainPrice: 156.50, fltNbr: 8912
  },
  {
    marketKey: 306, snapshotDateKey: 1876, dptrDateKey: 20260612, dptrTimeKey: 845,
    outbndBookingClassCd: 'Y', outbndFareBasis: 'FLEX', observationTmKey: 845, outbndFltNbr: 1047,
    priceExclTaxAmt: 142.30, priceInclTaxAmt: 169.80, taxAmt: 27.50, currencyKey: 1,
    carrKey: 200, carrAirlineCode: 'U2', carrAirlineName: 'easyJet',
    priceOutbndAmt: 142.30, priceInbndAmt: 0, isTaxInclFlg: 'Y',
    searchClass: 'ECONOMY', estimatedCos: 'STANDARD', saverSellup: 12.50,
    expectedFareBasis: '["FLEX"]', saverPrice: 121.80, mainPrice: 142.30, fltNbr: 1047
  }
];

// Route market mappings
const routeMarketMappings = [
  { marketKey: 274, originAirport: 'LGW', destinationAirport: 'BCN', routeCode: 'LGW-BCN', marketName: 'London Gatwick to Barcelona' },
  { marketKey: 306, originAirport: 'LGW', destinationAirport: 'AMS', routeCode: 'LGW-AMS', marketName: 'London Gatwick to Amsterdam' },
  { marketKey: 419, originAirport: 'LGW', destinationAirport: 'CDG', routeCode: 'LGW-CDG', marketName: 'London Gatwick to Paris Charles de Gaulle' },
  { marketKey: 345, originAirport: 'LGW', destinationAirport: 'MAD', routeCode: 'LGW-MAD', marketName: 'London Gatwick to Madrid' },
  { marketKey: 461, originAirport: 'LGW', destinationAirport: 'FCO', routeCode: 'LGW-FCO', marketName: 'London Gatwick to Rome Fiumicino' },
  { marketKey: 369, originAirport: 'LGW', destinationAirport: 'MXP', routeCode: 'LGW-MXP', marketName: 'London Gatwick to Milan Malpensa' },
  { marketKey: 370, originAirport: 'LGW', destinationAirport: 'ZUR', routeCode: 'LGW-ZUR', marketName: 'London Gatwick to Zurich' }
];

async function populateCompetitiveData() {
  console.log('🚀 Starting competitive pricing data population...');
  
  try {
    // Insert route market mappings first
    console.log('📍 Inserting route market mappings...');
    for (const mapping of routeMarketMappings) {
      await db.insert(routeMarkets).values(mapping).onConflictDoNothing();
    }
    console.log(`✅ Inserted ${routeMarketMappings.length} route market mappings`);
    
    // Insert competitive pricing data
    console.log('💰 Inserting competitive pricing data...');
    let insertedCount = 0;
    for (const data of sampleCompetitiveData) {
      await db.insert(competitivePricing).values(data).onConflictDoNothing();
      insertedCount++;
    }
    console.log(`✅ Inserted ${insertedCount} competitive pricing records`);
    
    // Verify data
    const totalRecords = await db.select().from(competitivePricing);
    const totalMarkets = await db.select().from(routeMarkets);
    
    console.log(`📊 Database now contains:`);
    console.log(`   - ${totalRecords.length} competitive pricing records`);
    console.log(`   - ${totalMarkets.length} route market mappings`);
    console.log(`   - Airlines: ${[...new Set(totalRecords.map(r => r.carrAirlineName))].join(', ')}`);
    console.log(`   - Routes: ${totalMarkets.map(m => m.routeCode).join(', ')}`);
    
  } catch (error) {
    console.error('❌ Error populating competitive data:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run the script
populateCompetitiveData()
  .then(() => {
    console.log('🎉 Competitive pricing data population completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Failed to populate competitive data:', error);
    process.exit(1);
  });

export { populateCompetitiveData };