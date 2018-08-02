'use strict';
var assert = require('assert');
var JSOEE = require('../src');

var _ = require('lodash');

var largeScript = `
# calculate charge basis

if (basis == "imp") {
  charges = (impressions / 1000) * 0.5;
} else {
  charges = (clicks/1000) * 0.5;
}

`;

var complexIfScript = `
# calculate charge basis

if (basis == "imp") {
  charges = (impressions / 1000) * 0.5;
} else if (basis == "clicks"){
  charges = (clicks/1000) * 0.25;
} else {
  charges = 20;

  fee = charges * 0.10
  mediaCost = 0

  #   If file.partner_code = “fltk” and file.media_cost equals 0
  #     file.fs_media_cost = ctrt_cost_per_pricing_model * impressions/1000

  if (partnerCode == "fltk" && mediaCost == 0 && useMatch == true) {
    fsMediaCost = ctrt_cost_per_pricing_model * impressions/1000
  }
}

`;

var switchCaseScript = `
# calculate charge basis

  mediaCost = 0

  switch (basis) {
    case "imp":
      charges = (impressions / 1000) * 0.5
      break;
    case "clicks":
      charges = (clicks/1000) * 0.25
      break;
    default:
      charges = 20
  }

  fee = charges * 0.10

  if (partnerCode == "fltk" && mediaCost == 0 && useMatch == true) {
    fsMediaCost = ctrt_cost_per_pricing_model * impressions/1000
  }
}

`;

var valScript = `
  likesCinema = val(likes, 'cinema')
  likesFastFood = val(likes, 'fast food')
`;

var nestedPropertyAccess = `
  partnerCode = context.partner.code
`;
var errorScript = `
# This is SRPE script

abc(

`;

describe('SRPE', function() {
  describe('Simple Statement', function() {
    it('should successfully parse a simple script', function() {
      assert.equal(_.isObject(JSOEE.eval('charges = 0')), true);
    });

    it('should successfully parse a large script', function() {
      var tran = {
        campaignId: 'C001',
        clicks: '1211',
        impressions: '254112',
        basis: 'imp',
      };
      var result = JSOEE.eval(largeScript, tran);

      assert.equal(_.isObject(result), true);
      const expectedCharges = (tran.impressions / 1000) * 0.5;
      assert.equal(expectedCharges, result.charges);
    });

    it('should successfully parse a complex if script', function() {
      var tran = {
        campaignId: 'C001',
        clicks: '1211',
        impressions: '254112',
        partnerCode: 'fltk',
        useMatch: true,
        costPerPricingModel: 0.10,
      };

      var result = JSOEE.eval(complexIfScript, tran);

      assert.equal(_.isObject(result), true);
      const expectedCharges = 20;
      assert.equal(expectedCharges, result.charges);
    });

    it('should successfully parse access of nested properties', function() {
      var tran = {
        context: { partner: {code: 'EMPR'} },
        campaignId: 'C001',
        clicks: '1211',
        impressions: '254112',
        partnerCode: 'fltk',
        useMatch: true,
        costPerPricingModel: 0.10,
      };

      var result = JSOEE.eval(nestedPropertyAccess, tran);

      assert.equal(_.isObject(result), true);
      const expected = 'EMPR';
      assert.equal(expected, result.partnerCode);
    });

    it('should successfully parse standard math function call', function() {
      var tran = {};

      var result = JSOEE.eval('d = 1000.12; c = round(d); f = min(10, 11)', tran);

      assert.equal(_.isObject(result), true);
      const expected = { c: 1000, d: 1000.12, f: 10 };
      assert.deepEqual(expected, result);
    });

    it('should throw error if switch statemet is used ', function() {

      assert.throws(function() {
        try {
          var result = JSOEE.eval(switchCaseScript, {});
        } catch (err) {
          throw err
        }
      }, Error);
    });

    it('should throw error for scripts with error', function() {
      assert.throws(function() {
        try {
          JSOEE.eval(errorScript);
        } catch (err) {
          throw err
        }
      }, Error);
    });

    it('should return null when no lookup table is specified', function() {
      var result = JSOEE.eval(lookupScript);
      assert.equal(result.min_temperature, null);
      assert.equal(result.max_temperature, null);
    });

    it('should return null if lookup tables does not contain table', function() {

      var context = {lookupTables: [{}]}
      var result = JSOEE.eval(lookupScript, context);
      assert.equal(result.min_temperature, null);
      assert.equal(result.max_temperature, null);
    });

    it('should return null if lookup tables are in improper format', function() {
      var context = {lookupTables: [{name: 'TEMPERATURES', values:[]}], city: 'chennai'};
      var result = JSOEE.eval(lookupScript, context);
      assert.equal(result.min_temperature, null);
      assert.equal(result.max_temperature, null);
    });

    var lookupScript = `
     min_temperature = lookup('TEMPERATURES', city, 'min')
     max_temperature = lookup('TEMPERATURES', city, 'max')
    `

    it('should return proper lookup values', function() {
      var context = {
        lookupTables: [{name: 'TEMPERATURES',
        values:[
            ['city', 'min', 'max'],
            ['chennai', 26, 41]
          ]
        }],
        city: 'chennai'
      };
      var result = JSOEE.eval(lookupScript, context);
      assert.equal(result.min_temperature, 26);
      assert.equal(result.max_temperature, 41);
    });

    var multiLookupScript = `
      min_temperature = mlookup('TEMPERATURES', lkey, 'min')
      temperature = mlookup('TEMPERATURES', lkey)
    `;

    it('should return multi-key lookup values', function() {
      var context = {
        lookupTables: [{name: 'TEMPERATURES',
          values: [
            {city: 'chennai', month: 'may', min: 35, max: 41},
            {city: 'chennai', month: 'june', min: 31, max: 38},
            {city: 'mumbai', month: 'may', min: 33, max: 41},
            {city: 'mumbai', month: 'june', min: 28, max: 38},
          ]
        }],
        lkey: {city: 'chennai', month: 'june'}
      };
      var result = JSOEE.eval(multiLookupScript, context);
      assert.equal(result.min_temperature, 31);
      assert.equal(result.temperature.max, 38);
    });

    it('should return multi-key lookup values when key is a array of tuple', function() {
      var context = {
        lookupTables: [{name: 'TEMPERATURES',
          values: [
            {city: 'chennai', month: 'may', min: 35, max: 41},
            {city: 'chennai', month: 'june', min: 31, max: 38},
            {city: 'mumbai', month: 'may', min: 33, max: 41},
            {city: 'mumbai', month: 'june', min: 28, max: 38},
          ]
        }],
        lkey: [['city', 'chennai'], ['month', 'june']]
      };
      var result = JSOEE.eval(multiLookupScript, context);
      assert.equal(result.min_temperature, 31);
      assert.equal(result.temperature.max, 38);
    });

    const rangeLookupScript = `
      ageClass = rlookup('AGE', 'from', 'to', age, 'class')
      lookupResult = rlookup('AGE', 'from', 'to', age)
    `;

    it('should return range lookup values', function() {
      var context = {
        lookupTables: [{name: 'AGE',
          values: [
            {from: 0, to: 5, class: 'infant'},
            {from: 6, to: 12, class: 'child'},
            {from: 13, to: 18, class: 'young adult'},
            {from: 18, to: 100, class: 'adult'},
          ]
        }],
        age: 12
      };
      var result = JSOEE.eval(rangeLookupScript, context);
      assert.equal(result.ageClass, 'child');
      assert.equal(result.lookupResult.class, 'child');
    });

    it('should pick values from object', function() {
      var context = {
        age: 12,
        likes: {cinema: true, 'fast food': false}
      };
      var result = JSOEE.eval(valScript, context);
      assert.equal(result.likesCinema, true);
      assert.equal(result.likesFastFood, false);
    });

    it('should generate tokens from script', function() {
      var script = `
      if(EquipmentType == 'Air source heat pump')
      {
      EERpre = (1-EL) * EERpost
      HSPFpre = (1-EL) * HSPFpost
      kWhC = Capacity * ((1/EERpre) - (1/EERpost)) * EFLHC * 0.001
      kWhH = Capacity * ((1/HSPFpre) - (1/HSPFpost)) * EFLHH * 0.001
      kWh = Q * (kWhC + kWhH)
      kWs = Capacity * ((1/EERpre) - (1/EERpost)) * DFc * 0.001
      kWw  = Capacity * ((1/HSPFpre) - (1/HSPFpost)) * DFh * 0.001
      kW = Q * ( max(kWs,kWw ))
      }
      else
      {
      EERpre = (1-EL) * EERpost
      HSPFpre = (1-EL) * HSPFpost
      kWhC = Capacity * ((1/EERpre) - (1/EERpost)) * EFLHC * 0.001
      kWh = Q * (kWhC)
      kWs = Capacity * ((1/EERpre) - (1/EERpost)) * DFc * 0.001
      kW = Q * kWs
      }
      `
      var result = JSOEE.tokenize(script);
      assert(result.length !== 0, true)
    });

    it('should generate EOF token when script is empty', function() {
      var script = ``
      var result = JSOEE.tokenize(script);
      assert(result.length === 1, true)
    });

    it ('should parse a valid date', function (){
      var script = `d = parseDate(birthDay)`
      var context = {
        birthDay: '1981-03-30T18:30:00.000Z'
      }
      var result = JSOEE.eval(script, context);
      assert.equal(result.d.toString(), new Date('1981-03-30T18:30:00.000Z').toString());
    })

    it ('should not parse an invalid date', function (){
      var script = `d = parseDate(birthDay)`
      var context = {
        birthDay: '1981-AA'
      }
      var result = JSOEE.eval(script, context);
      assert.equal(result.d, 'Invalid Date');
    })

    it ('should accumulate errors when defined', function () {
      var script = `
        c = b/a
        if (c < 0) {
          ERROR('E001', 'b should be a positive number')
        }
      `
      var context = {
        a: 10,
        b: -5
      }
      var result = JSOEE.eval(script, context)
      assert.equal(result.errors.length, 1)
    })

    it ('should accumulate warnings when defined', function () {
      var script = `
        c = b/a
        if (c < 0) {
          WARNING('E001', 'b should be a positive number')
        }
      `
      var context = {
        a: 10,
        b: -5
      }
      var result = JSOEE.eval(script, context)
      assert.equal(result.warnings.length, 1)
    })

    it ('should calculate minBy', function () {
      var script = `
        minTemp = minBy(cities, 'minT')
      `
      var context = {
        cities: [{name: 'Chennai', minT: 25, maxT: 41}, {name: 'Bangalore', minT: 14, maxT: 36}, {name: 'Delhi', minT: 6, maxT: 44}]
      }
      var result = JSOEE.eval(script, context)
      assert.equal(result.minTemp, 6)
    })

    it ('should calculate maxBy', function () {
      var script = `
        maxTemp = maxBy(cities, 'minT')
      `
      var context = {
        cities: [{name: 'Chennai', minT: 25, maxT: 41}, {name: 'Bangalore', minT: 14, maxT: 36}, {name: 'Delhi', minT: 6, maxT: 44}]
      }
      var result = JSOEE.eval(script, context)
      assert.equal(result.maxTemp, 25)
    })

    it ('should calculate sumBy', function () {
      var script = `
        sumMinTemp = sumBy(cities, 'minT')
      `
      var context = {
        cities: [{name: 'Chennai', minT: 25, maxT: 41}, {name: 'Bangalore', minT: 14, maxT: 36}, {name: 'Delhi', minT: 6, maxT: 44}]
      }
      var result = JSOEE.eval(script, context)
      assert.equal(result.sumMinTemp, 45)
    })
    it ('should calculate count', function () {
      var script = `
        count = count(cities)
      `
      var context = {
        cities: [{name: 'Chennai', minT: 25, maxT: 41}, {name: 'Bangalore', minT: 14, maxT: 36}, {name: 'Delhi', minT: 6, maxT: 44}]
      }
      var result = JSOEE.eval(script, context)
      assert.equal(result.count, 3)
    })

    it ('should calculate avgBy', function () {
      var script = `
        avg = avgBy(cities, 'maxT')
      `
      var context = {
        cities: [{name: 'Chennai', minT: 25, maxT: 41}, {name: 'Bangalore', minT: 14, maxT: 36}, {name: 'Delhi', minT: 6, maxT: 44}]
      }
      var result = JSOEE.eval(script, context)
      assert.equal(result.avg, (41 + 36 + 44) / 3)
    })

    it ('should calculate countDistinct', function () {
      var script = `
        count = countDistinct(cities, 'maxT')
      `
      var context = {
        cities: [{name: 'Chennai', minT: 25, maxT: 44}, {name: 'Bangalore', minT: 14, maxT: 36}, {name: 'Delhi', minT: 6, maxT: 44}]
      }
      var result = JSOEE.eval(script, context)
      // Chennai and Delhi have same maxT hence 2
      assert.equal(result.count, 2)
    })

    it ('should return index of an array', function () {
      const data = `
      {
      "_id": "5b45e3b10f28343b36f7667b",
      "programBudget": [
      {
          "amount": 50000,
          "startDate": "2018-07-31T18:30:00.000Z",
          "endDate": "2019-08-30T18:30:00.000Z",
          "id": "717294f0-9643-11e8-9308-5b3f2bf0c472",
          "programId": "660734a0-8f3f-11e8-9615-49ce8863b9a9"
      }
          ]
      }
      `
      const context = JSON.parse(data)
      const script = `
        pb = valAt(programBudget, 0)
      `
      var result = JSOEE.eval(script, context)
      // Chennai and Delhi have same maxT hence 2
      assert.equal(result.pb.amount, 50000)
      
    })
  })

});
