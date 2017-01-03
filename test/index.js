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
  })
});
