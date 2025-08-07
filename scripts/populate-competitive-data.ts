#!/usr/bin/env tsx
/**
 * Populate competitive pricing data from sample infare_webfare_fact data
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { infare_webfare_fact } from '../shared/schema';

const client = postgres(process.env.DEV_DATABASE_URL || process.env.DATABASE_URL!);
const db = drizzle(client);

// Sample data from the provided infare_webfare_fact table (proper field names)
const sampleCompetitiveData = [
  {
    market_key: 274, snapshot_date_key: 1872, dptr_date_key: 20260711, dptr_time_key: 4081,
    outbnd_booking_class_cd: 'M', outbnd_fare_basis: 'YAP21', observation_tm_key: 1418, outbnd_flt_nbr: 9586,
    price_excl_tax_amt: 848.48, price_incl_tax_amt: 610.82, tax_amt: 116.68, currency_key: 1,
    carr_key: 999, carr_airline_code: 'TL', carr_airline_name: 'Telos Airlines',
    price_outbnd_amt: 405.59, price_inbnd_amt: 1288.52, is_tax_incl_flg: 'Y',
    search_class: 'PREMIUM_ECONOMY', estimated_cos: 'dummy_ESTIMATED_COS_0', saver_sellup: 122.3,
    expected_fare_basis: JSON.parse('["BAP21"]'), saver_price: 140.89, main_price: 1233.56, flt_nbr: 232
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
  // Realistic European competitor data for EasyJet routes
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
    marketKey: 274, snapshotDateKey: 1876, dptrDateKey: 20260612, dptrTimeKey: 845,
    outbndBookingClassCd: 'Y', outbndFareBasis: 'BASIC', observationTmKey: 845, outbndFltNbr: 6732,
    priceExclTaxAmt: 189.50, priceInclTaxAmt: 215.30, taxAmt: 25.80, currencyKey: 1,
    carrKey: 201, carrAirlineCode: 'BA', carrAirlineName: 'British Airways',
    priceOutbndAmt: 189.50, priceInbndAmt: 0, isTaxInclFlg: 'Y',
    searchClass: 'ECONOMY', estimatedCos: 'PREMIUM', saverSellup: 22.50,
    expectedFareBasis: '["BASIC"]', saverPrice: 167.00, mainPrice: 189.50, fltNbr: 6732
  },
  {
    marketKey: 274, snapshotDateKey: 1877, dptrDateKey: 20260612, dptrTimeKey: 920,
    outbndBookingClassCd: 'Y', outbndFareBasis: 'BASIC', observationTmKey: 920, outbndFltNbr: 4521,
    priceExclTaxAmt: 138.30, priceInclTaxAmt: 159.80, taxAmt: 21.50, currencyKey: 1,
    carrKey: 202, carrAirlineCode: 'FR', carrAirlineName: 'Ryanair',
    priceOutbndAmt: 138.30, priceInbndAmt: 0, isTaxInclFlg: 'Y',
    searchClass: 'ECONOMY', estimatedCos: 'BASIC', saverSellup: 8.20,
    expectedFareBasis: '["BASIC"]', saverPrice: 118.40, mainPrice: 138.30, fltNbr: 4521
  },
  {
    marketKey: 306, snapshotDateKey: 1878, dptrDateKey: 20260612, dptrTimeKey: 1015,
    outbndBookingClassCd: 'Y', outbndFareBasis: 'LIGHT', observationTmKey: 1015, outbndFltNbr: 1123,
    priceExclTaxAmt: 194.75, priceInclTaxAmt: 224.90, taxAmt: 30.15, currencyKey: 1,
    carrKey: 203, carrAirlineCode: 'KL', carrAirlineName: 'KLM',
    priceOutbndAmt: 194.75, priceInbndAmt: 0, isTaxInclFlg: 'Y',
    searchClass: 'ECONOMY', estimatedCos: 'PREMIUM', saverSellup: 28.50,
    expectedFareBasis: '["LIGHT"]', saverPrice: 172.20, mainPrice: 194.75, fltNbr: 1123
  },
  {
    marketKey: 419, snapshotDateKey: 1879, dptrDateKey: 20260612, dptrTimeKey: 1145,
    outbndBookingClassCd: 'Y', outbndFareBasis: 'LITE', observationTmKey: 1145, outbndFltNbr: 5647,
    priceExclTaxAmt: 184.60, priceInclTaxAmt: 212.40, taxAmt: 27.80, currencyKey: 1,
    carrKey: 204, carrAirlineCode: 'AF', carrAirlineName: 'Air France',
    priceOutbndAmt: 184.60, priceInbndAmt: 0, isTaxInclFlg: 'Y',
    searchClass: 'ECONOMY', estimatedCos: 'PREMIUM', saverSellup: 24.80,
    expectedFareBasis: '["LITE"]', saverPrice: 162.30, mainPrice: 184.60, fltNbr: 5647
  }
];

// Convert market keys to route mappings
const marketToRoute: Record<number, string> = {
  274: 'LGW-BCN',
  306: 'LGW-AMS', 
  419: 'LGW-CDG',
  345: 'LGW-MAD',
  461: 'LGW-FCO',
  369: 'LGW-MXP',
  370: 'LGW-ZUR'
};

async function populateCompetitiveData() {
  console.log('🚀 Starting competitive pricing data population...');
  
  try {
    // Insert competitive pricing data with proper mapping to database schema
    console.log('💰 Inserting competitive pricing data...');
    let insertedCount = 0;
    
    for (const data of sampleCompetitiveData) {
      const routeId = marketToRoute[data.market_key];
      if (!routeId) {
        console.log(`⚠️ Skipping unknown market key: ${data.market_key}`);
        continue;
      }
      
      // Insert directly into infare_webfare_fact table with original structure
      await db.insert(infare_webfare_fact).values(data).onConflictDoNothing();
      insertedCount++;
    }
    
    console.log(`✅ Inserted ${insertedCount} competitive pricing records`);
    
    // Verify data
    const totalRecords = await db.select().from(infare_webfare_fact);
    const uniqueAirlines = [...new Set(totalRecords.map(r => r.carr_airline_code))];
    const uniqueMarkets = [...new Set(totalRecords.map(r => r.market_key))];
    
    console.log(`📊 Database now contains:`);
    console.log(`   - ${totalRecords.length} infare webfare fact records`);
    console.log(`   - Airlines: ${uniqueAirlines.join(', ')}`);
    console.log(`   - Market Keys: ${uniqueMarkets.join(', ')}`);
    
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