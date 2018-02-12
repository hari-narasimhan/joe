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
  })

});
