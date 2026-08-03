import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { computeCatalogConsolidationAudit } from './lib/catalog-consolidation-audit.mjs';

const root = path.resolve(import.meta.dirname, '..');
const read = rel => JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
const groups = read('data/product-groups.json');
const variants = read('data/variants.json');
const groupById = new Map(groups.map(item => [item.id, item]));
const variantById = new Map(variants.map(item => [item.id, item]));

const categoryExpected = new Map([
  ['bosch-professional-gll-80-33-cg-lijnlaser', 'bouwplaats'],
  ['bosch-professional-glm-40-laserafstandmete', 'bouwplaats'],
  ['bosch-professional-grl-300-hv-set-rotatiel', 'bouwplaats'],
  ['bosch-professional-gpo-12v', 'polijstmachines'],
  ['bosch-professional-gpo-14', 'polijstmachines'],
  ['bosch-professional-gpo12v', 'polijstmachines'],
  ['bosch-professional-gpx12v', 'polijstmachines'],
  ['bosch-professional-gpx9', 'polijstmachines'],
  ['bosch-professional-gts-10-xc-zaagtafel', 'zaagmachines'],
]);
for (const [groupId, categoryId] of categoryExpected) {
  assert.equal(groupById.get(groupId)?.categoryId, categoryId, `${groupId} staat niet in ${categoryId}.`);
  const family = variants.filter(item => item.groupId === groupId);
  assert.ok(family.length > 0, `${groupId} heeft geen uitvoeringen.`);
  assert.ok(family.every(item => item.categoryId === categoryId), `${groupId} heeft een uitvoering in een verkeerde categorie.`);
}

const platformExpected = new Map([
  ['feed-dewalt-dcs565p2-qw', 'DeWalt XR 18V'],
  ['feed-dewalt-dcs572p2-qw', 'DeWalt XR 18V'],
  ['feed-dewalt-dcs573t1-qw', 'DeWalt XR 18V FlexVolt Advantage'],
  ['feed-makita-df333dnx12', 'Makita CXT 12V Max'],
]);
for (const [variantId, platform] of platformExpected) {
  assert.equal(variantById.get(variantId)?.platform, platform, `${variantId} heeft een verkeerd machineplatform.`);
}
assert.equal(groupById.get('dewalt-dcs572')?.platform, 'DeWalt XR 18V');
assert.equal(groupById.get('dewalt-dcs573')?.platform, 'DeWalt XR 18V FlexVolt Advantage');

assert.ok(!groupById.has('makita-lm002'), 'Oud samengevoegd LM002-basismodel bestaat nog.');
assert.ok(!groupById.has('makita-lm004'), 'Oud samengevoegd LM004-basismodel bestaat nog.');
assert.deepEqual(variants.filter(item => item.groupId === 'makita-lm002g').map(item => item.id), ['feed-makita-lm002gz']);
assert.deepEqual(variants.filter(item => item.groupId === 'makita-lm002j').map(item => item.id), ['feed-makita-lm002jm101']);
assert.deepEqual(variants.filter(item => item.groupId === 'makita-lm004g').map(item => item.id).sort(), ['feed-makita-lm004gm103', 'feed-makita-lm004gz']);
assert.deepEqual(variants.filter(item => item.groupId === 'makita-lm004j').map(item => item.id), ['feed-makita-lm004jb101']);

for (const [category, expectedIds] of Object.entries({
  bouwplaats: ['toolmax--feed-bosch-professional-0601065500', 'toolmax--feed-bosch-professional-0601072900', 'toolmax--feed-bosch-professional-061599405u'],
  polijstmachines: ['toolmax--feed-bosch-professional-06019l3000', 'toolmax--feed-bosch-professional-0601389200', 'toolmax--feed-bosch-professional-06019l3003', 'toolmax--feed-bosch-professional-06019l4003', 'toolmax--feed-bosch-professional-06019l4101', 'toolmax--feed-bosch-professional-06013b1000'],
  zaagmachines: ['toolmax--feed-bosch-professional-0615990em9', 'toolmax--feed-bosch-professional-0601b30400'],
})) {
  for (const prefix of ['data/offers', 'data/published/offers']) {
    const offers = read(`${prefix}/${category}.json`);
    for (const id of expectedIds) assert.ok(offers.some(item => item.id === id), `${id} ontbreekt in ${prefix}/${category}.json`);
  }
}


const mastertoolsDewaltAfkortzaagCodes = [
  'DCS777T2-QW', 'DWS780-QS', 'DWS778-QS', 'DCS777N-XJ', 'DWS777-QS',
  'DWS727-QS', 'DCS727T2-QW', 'DCS727N-XJ', 'DCS365N-XJ', 'DWS773-QS',
  'DCS781X2-QW', 'DCS781N-XJ', 'DCS782N-XJ', 'DCS782XW2-QW', 'DW872-QS',
  'D28715-QS', 'D28730-QS',
];
const afkortzaagVariants = variants.filter(item => item.categoryId === 'afkortzagen');
for (const code of mastertoolsDewaltAfkortzaagCodes) {
  const variant = afkortzaagVariants.find(item => item.matchKeys?.manufacturerSku === code);
  assert.ok(variant, `${code} ontbreekt als exacte DeWalt-afkortzaaguitvoering.`);
  assert.equal(variant.setContentsSource, 'Mastertools · Leveringsomvang op de exacte productpagina');
  assert.equal(variant.matchKeys.ean, variant.sourceRef.ean, `${code} heeft geen consistente EAN.`);
  for (const prefix of ['data/offers', 'data/published/offers']) {
    const offers = read(`${prefix}/afkortzagen.json`);
    const offer = offers.find(item => item.merchantId === 'mastertools' && item.manufacturerSku === code);
    assert.ok(offer, `${code} ontbreekt in ${prefix}/afkortzagen.json`);
    assert.equal(offer.ean, variant.matchKeys.ean, `${code} heeft een aanbieders-EAN-conflict.`);
  }
}
assert.equal(read('data/offers/afkortzagen.json').length, 49, 'Onverwacht aantal bronaanbiedingen bij afkortzagen.');
assert.equal(read('data/published/offers/afkortzagen.json').length, 49, 'Onverwacht aantal gepubliceerde aanbiedingen bij afkortzagen.');


const mastertoolsDewaltFreesCodes = [
  'D26204K-QS', 'DWE627KT-QS', 'D26203-QS', 'DW682K-QS', 'DWE625-QS',
];
const freesVariants = variants.filter(item => item.categoryId === 'frezen');
for (const code of mastertoolsDewaltFreesCodes) {
  const variant = freesVariants.find(item => item.matchKeys?.manufacturerSku === code);
  assert.ok(variant, `${code} ontbreekt als exacte DeWalt-freesuitvoering.`);
  assert.equal(variant.setContentsSource, 'Mastertools · Leveringsomvang op de exacte productpagina');
  assert.equal(variant.matchKeys.ean, variant.sourceRef.ean, `${code} heeft geen consistente EAN.`);
  for (const prefix of ['data/offers', 'data/published/offers']) {
    const offers = read(`${prefix}/frezen.json`);
    const offer = offers.find(item => item.merchantId === 'mastertools' && item.manufacturerSku === code);
    assert.ok(offer, `${code} ontbreekt in ${prefix}/frezen.json`);
    assert.equal(offer.ean, variant.matchKeys.ean, `${code} heeft een aanbieders-EAN-conflict.`);
  }
}
assert.equal(read('data/offers/frezen.json').length, 48, 'Onverwacht aantal bronaanbiedingen bij frezen.');
assert.equal(read('data/published/offers/frezen.json').length, 48, 'Onverwacht aantal gepubliceerde aanbiedingen bij frezen.');


const mastertoolsDewaltSchuurCodesByCategory = {
  schuurmachines: [
    'DCM200N-XJ', 'DCM200NT-XJ', 'DCM200E2T-QW', 'DCW210P2-QW', 'DCW210NT-XJ', 'DCW210N-XJ',
    'DCW200P2-QW', 'DCW200NT-XJ', 'DCW200N-XJ', 'DCW220P2-QW', 'DCW220NT-XJ', 'DCW220N-XJ',
    'DWE6423-QS', 'DWE6411-QS', 'DCE800NB-XJ', 'DWE7800-QS',
  ],
  'haakse-slijpers': ['DWE4257KT-QS'],
};
for (const [categoryId, codes] of Object.entries(mastertoolsDewaltSchuurCodesByCategory)) {
  const categoryVariants = variants.filter(item => item.categoryId === categoryId);
  for (const code of codes) {
    const variant = categoryVariants.find(item => item.matchKeys?.manufacturerSku === code);
    assert.ok(variant, `${code} ontbreekt als exacte DeWalt-schuuruitvoering.`);
    assert.equal(variant.setContentsSource, 'Mastertools · Leveringsomvang op de exacte productpagina');
    assert.equal(variant.matchKeys.ean, variant.sourceRef.ean, `${code} heeft geen consistente EAN.`);
    for (const prefix of ['data/offers', 'data/published/offers']) {
      const offers = read(`${prefix}/${categoryId}.json`);
      const offer = offers.find(item => item.merchantId === 'mastertools' && item.manufacturerSku === code);
      assert.ok(offer, `${code} ontbreekt in ${prefix}/${categoryId}.json`);
      assert.equal(offer.ean, variant.matchKeys.ean, `${code} heeft een aanbieders-EAN-conflict.`);
    }
  }
}
assert.equal(read('data/offers/schuurmachines.json').length, 86, 'Onverwacht aantal bronaanbiedingen bij schuurmachines.');
assert.equal(read('data/published/offers/schuurmachines.json').length, 86, 'Onverwacht aantal gepubliceerde aanbiedingen bij schuurmachines.');
assert.equal(read('data/offers/haakse-slijpers.json').length, 224, 'Onverwacht aantal bronaanbiedingen bij haakse slijpers.');
assert.equal(read('data/published/offers/haakse-slijpers.json').length, 224, 'Onverwacht aantal gepubliceerde aanbiedingen bij haakse slijpers.');


const mastertoolsDewaltTuinCodes = [
  'DCMST561N-XJ', 'DCMST561P1-QW', 'DCM571N-XJ', 'DCM571X1-QW', 'DCMAS5713N-XJ', 'DCMAS5713X1-QW',
  'DCMHT562N-XJ', 'DCMHT562P1-QW', 'DCMHT563N-XJ', 'DCMHT564N-XJ', 'DCMHT564P1-QW', 'DCMHT573N-XJ',
  'DCMHT573X1-QW', 'DCMPH566N-XJ', 'DCMPH566P1-QW', 'DCMPP568N-XJ', 'DCMPP568P1-QW', 'DCMPP569N-XJ',
  'DCMPP569P1-QW', 'DCMCS565N-XJ', 'DCMCS565P1-QW', 'DCMCS574N-XJ', 'DCMCS574X1-QW', 'DCMCS575N-XJ',
  'DCMCS575X1-QW', 'DCMPS567N-XJ', 'DCMPS567P1-QW', 'DCMPS635N-XJ',
];
const tuinVariants = variants.filter(item => item.categoryId === 'tuinmachines');
const tuinOffersByScope = ['data/offers/tuinmachines.json', 'data/published/offers/tuinmachines.json'];
for (const code of mastertoolsDewaltTuinCodes) {
  const variant = tuinVariants.find(item => item.matchKeys?.manufacturerSku === code);
  assert.ok(variant, `${code} ontbreekt als exacte DeWalt-tuinmachine-uitvoering.`);
  assert.equal(variant.setContentsSource, 'Mastertools · Leveringsomvang op de exacte productpagina');
  assert.equal(variant.matchKeys.ean, variant.sourceRef.ean, `${code} heeft geen consistente EAN.`);
  for (const offerFile of tuinOffersByScope) {
    const offer = read(offerFile).find(item => item.merchantId === 'mastertools' && item.manufacturerSku === code);
    assert.ok(offer, `${code} ontbreekt in ${offerFile}`);
    assert.equal(offer.ean, variant.matchKeys.ean, `${code} heeft een aanbieders-EAN-conflict.`);
  }
}
assert.equal(tuinVariants.some(item => item.matchKeys?.manufacturerSku === 'DCM563P1-QW'), false, 'DCM563P1-QW mag niet dubbel naast de bestaande DCM563P1-EAN worden gepubliceerd.');
assert.equal(read('data/offers/tuinmachines.json').length, 329, 'Onverwacht aantal bronaanbiedingen bij tuinmachines.');
assert.equal(read('data/published/offers/tuinmachines.json').length, 329, 'Onverwacht aantal gepubliceerde aanbiedingen bij tuinmachines.');


const mastertoolsDewaltTackerCodes = [
  'DCN45RND2-QW', 'DCN660N-XJ', 'DCN930P2-QW', 'DCN930N-XJ', 'DCN950N-XJ', 'DCN681N-XJ',
  'DCN680N-XJ', 'DCN660NT-XJ', 'DCN650N-XJ', 'DCN650P2-QW', 'DCN680D2-QW', 'DCN680NT-XJ',
];
const mastertoolsDewaltMeasuringLaserCodes = [
  'DW055PL-XJ', 'DWHT77100-XJ', 'DWHT77200-XJ', 'DCE089D1R-QW', 'DCE089NG18-XJ', 'DCE089D1G-QW',
  'DCE089D1G18-QW', 'DCE0825D1G-QW', 'DCLE34021N-XJ', 'DCLE34035D1-QW', 'DW088KTRI', 'DW088K-XJ',
  'DCE089D1GTRI', 'DCE089D1GTRID', 'DW088CG-XJ', 'DW088CGTRI', 'DCLE34021D1-QW', 'DCE088D1G18-QW',
];
for (const [categoryId, codes] of Object.entries({spijkerpistolen: mastertoolsDewaltTackerCodes, bouwplaats: mastertoolsDewaltMeasuringLaserCodes})) {
  const categoryVariants = variants.filter(item => item.categoryId === categoryId);
  for (const code of codes) {
    const variant = categoryVariants.find(item => item.matchKeys?.manufacturerSku === code);
    assert.ok(variant, `${code} ontbreekt als exacte DeWalt-uitvoering in ${categoryId}.`);
    assert.equal(variant.setContentsSource, 'Mastertools · Leveringsomvang op de exacte productpagina');
    assert.equal(variant.matchKeys.ean, variant.sourceRef.ean, `${code} heeft geen consistente EAN.`);
    for (const prefix of ['data/offers', 'data/published/offers']) {
      const offer = read(`${prefix}/${categoryId}.json`).find(item => item.merchantId === 'mastertools' && item.manufacturerSku === code);
      assert.ok(offer, `${code} ontbreekt in ${prefix}/${categoryId}.json`);
      assert.equal(offer.ean, variant.matchKeys.ean, `${code} heeft een aanbieders-EAN-conflict.`);
    }
  }
}
for (const code of ['DDF5110500', 'DPN1850PP-XJ', 'DCE0811D1G-QW']) {
  assert.equal(variants.some(item => item.matchKeys?.manufacturerSku === code), false, `${code} mag niet worden gepubliceerd met onvolledige Leveringsomvang.`);
}
assert.equal(read('data/offers/spijkerpistolen.json').length, 49, 'Onverwacht aantal bronaanbiedingen bij spijkerpistolen.');
assert.equal(read('data/published/offers/spijkerpistolen.json').length, 49, 'Onverwacht aantal gepubliceerde aanbiedingen bij spijkerpistolen.');
assert.equal(read('data/offers/bouwplaats.json').length, 165, 'Onverwacht aantal bronaanbiedingen bij bouwplaats.');
assert.equal(read('data/published/offers/bouwplaats.json').length, 165, 'Onverwacht aantal gepubliceerde aanbiedingen bij bouwplaats.');


const mastertoolsDewaltMixedV0579 = {
  reiniging: ['DCV584L-QW','DXV20PTA','DXV15T','DXV20P','DWH161N-XJ','DXV23G','DWXAF201'],
  bouwplaats: ['DCR027-QW','DCR020-QW','DCR029-QW','DCR019-QW','DWST1-81078-QW','DCR011-XJ','190 1148 DWG','DCL183-XJ','DCL077-XJ','DCL074-XJ','DCL079-XJ','DCL045-XJ','DCE512N-XJ'],
  'specialistische-machines': ['DXCMD155PE','DXCMS156RE'],
  schaafmachines: ['DCP580P2-QW','DCP580N-XJ','DCP580NT-XJ'],
  slagmoersleutels: ['DCF510N-XJ','DCF503EN-XJ','DCF504N-XJ','DCF512N-XJ','DCF513N-XJ'],
};
for (const [categoryId, codes] of Object.entries(mastertoolsDewaltMixedV0579)) {
  const sourceOffers = read(`data/offers/${categoryId}.json`);
  const publishedOffers = read(`data/published/offers/${categoryId}.json`);
  for (const code of codes) {
    const variant = variants.find(item => item.categoryId === categoryId && item.matchKeys?.manufacturerSku === code);
    assert.ok(variant, `${code} ontbreekt als exacte DeWalt-uitvoering in ${categoryId}.`);
    assert.equal(variant.setContentsSource, 'Mastertools · Leveringsomvang op de exacte productpagina');
    assert.equal(variant.matchKeys.ean, variant.sourceRef.ean, `${code} heeft geen consistente EAN.`);
    for (const offers of [sourceOffers, publishedOffers]) {
      const offer = offers.find(item => item.merchantId === 'mastertools' && item.manufacturerSku === code);
      assert.ok(offer, `${code} ontbreekt als Mastertools-aanbieding in ${categoryId}.`);
      assert.equal(offer.ean, variant.matchKeys.ean, `${code} heeft een aanbieders-EAN-conflict.`);
    }
  }
}
for (const code of ['DXV50SAPTA','DCF900H2T-QW','DW680-QS']) {
  assert.equal(variants.some(item => item.matchKeys?.manufacturerSku === code), false, `${code} mag niet worden gepubliceerd met foutieve of onvolledige Leveringsomvang.`);
}
assert.equal(variants.filter(item => item.matchKeys?.manufacturerSku === 'DCS512N-XJ').length, 1, 'DCS512N-XJ mag niet dubbel worden toegevoegd.');
assert.equal(read('data/published/offers/reiniging.json').length, 121, 'Onverwacht aantal aanbiedingen bij reiniging.');
assert.equal(read('data/published/offers/bouwplaats.json').length, 165, 'Onverwacht aantal aanbiedingen bij bouwplaats.');
assert.equal(read('data/published/offers/specialistische-machines.json').length, 87, 'Onverwacht aantal aanbiedingen bij specialistische machines.');
assert.equal(read('data/published/offers/schaafmachines.json').length, 16, 'Onverwacht aantal aanbiedingen bij schaafmachines.');
assert.equal(read('data/published/offers/slagmoersleutels.json').length, 109, 'Onverwacht aantal aanbiedingen bij slagmoersleutels.');


const mastertoolsDewaltDrillsV0580 = {
  accuboormachines: ["DCD1007NT-XJ", "DCD1007WW1T-QW", "DCD1007H2T-QW", "DCD444N-XJ", "DCD777D2T-QW", "DCD777M2T-QW", "DCD710D2-QW", "DCD778D2T-QW", "DCD805E1T-QW", "DCD805NT-XJ", "DCD701D2-QW", "DCD800E2T-QW", "DCD805E2T-QW", "DCD800NT-XJ", "DCD703NT-XJ", "DCD799D2T-QW", "DCD799NT-XJ", "DCD706D2-QW", "DCD799N-XJ", "DCD470N-XJ", "DCD800H2T-QW", "DCD701N-XJ"],
  'specialistische-machines': ["DCD1623N-XJ", "DWE1622K-QS"],
  schroefmachines: ["DCF620NT-XJ", "DCF620D2K-QW", "DCF601D2-QW", "DCF620P2K-QW", "DCF620E1K-XJ", "DCF620N-XJ"],
};
for (const [categoryId, codes] of Object.entries(mastertoolsDewaltDrillsV0580)) {
  const sourceOffers = read(`data/offers/${categoryId}.json`);
  const publishedOffers = read(`data/published/offers/${categoryId}.json`);
  for (const code of codes) {
    const variant = variants.find(item => item.categoryId === categoryId && item.matchKeys?.manufacturerSku === code);
    assert.ok(variant, `${code} ontbreekt in ${categoryId}.`);
    assert.equal(variant.setContentsSource, 'Mastertools · Leveringsomvang op de exacte productpagina');
    assert.equal(variant.matchKeys.ean, variant.sourceRef.ean, `${code} heeft een EAN-conflict.`);
    for (const offers of [sourceOffers, publishedOffers]) {
      const offer = offers.find(item => item.merchantId === 'mastertools' && item.manufacturerSku === code);
      assert.ok(offer, `${code} ontbreekt als Mastertools-aanbieding.`);
      assert.equal(offer.ean, variant.matchKeys.ean);
    }
  }
}
for (const code of ["D21570K-QS", "DWD522KS-QS", "DCD805H2T-QW", "DCD996N-XJ", "DCD703L2T-QW", "DCD799P2T-QW"]) assert.equal(variants.some(item => item.matchKeys?.manufacturerSku === code && item.source === 'tradetracker-mastertools-dewalt-new-execution'), false, `${code} mag niet vanuit v0.5.280 worden gepubliceerd.`);
assert.equal(read('data/published/offers/accuboormachines.json').length, 231);
assert.equal(read('data/published/offers/specialistische-machines.json').length, 87);
assert.equal(read('data/published/offers/schroefmachines.json').length, 30);


const mastertoolsDewaltGardenMeasureV0581 = {"polijstmachines": ["DCM848N-XJ", "DCM849N-XJ"], "tuinmachines": ["DCMBL777N-XJ", "DCMBL777X1-QW", "DCMBA572N-XJ", "DCMBA572X1-QW", "DCMWP500N-XJ", "DCMWSP156N-XJ", "DCMWSP156W2-QW", "DCMWSP550N-XJ", "DCMWSP660N-XJ", "DCMWP134W2-QW"], "bouwplaats": ["DCE6820N-XJ", "DCE050N-XJ", "DCE825NG18-XJ", "DCLE14301GB-XJ", "DCLE14251GB-XJ", "DW0822-XJ", "DCLE14201GB-XJ", "DCE080D1RS-QW"], "spijkerpistolen": ["DCN662D2-QW", "DCN910N-XJ", "DCN662NT-XJ", "DCN701N-XJ"], "frezen": ["DCW620NT-XJ", "DCW620H2-QW", "DCW682N-XJ", "DCW682NT-XJ", "DCW604N-XJ"]};
for (const [categoryId, codes] of Object.entries(mastertoolsDewaltGardenMeasureV0581)) {
  const sourceOffers = read(`data/offers/${categoryId}.json`);
  const publishedOffers = read(`data/published/offers/${categoryId}.json`);
  for (const code of codes) {
    const variant = variants.find(item => item.categoryId === categoryId && item.matchKeys?.manufacturerSku === code);
    assert.ok(variant, `${code} ontbreekt in ${categoryId}.`);
    assert.equal(variant.setContentsSource, 'Mastertools · Leveringsomvang op de exacte productpagina');
    assert.equal(variant.matchKeys.ean, variant.sourceRef.ean, `${code} heeft een EAN-conflict.`);
    for (const offers of [sourceOffers, publishedOffers]) {
      const offer = offers.find(item => item.merchantId === 'mastertools' && item.manufacturerSku === code);
      assert.ok(offer, `${code} ontbreekt als Mastertools-aanbieding.`);
      assert.equal(offer.ean, variant.matchKeys.ean);
    }
  }
}
for (const code of ["DCE0811D1G-QW", "DCE0811D1R-QW", "DW03101-XJ", "DW03050-XJ", "DCN681D2-QW", "DCN930N-XJ"]) {
  const fromBatch = variants.filter(item => item.matchKeys?.manufacturerSku === code && item.source === 'tradetracker-mastertools-dewalt-new-execution');
  if (code === 'DCN930N-XJ') assert.equal(fromBatch.length, 1, `${code} moet precies eenmaal live blijven.`);
  else assert.equal(fromBatch.length, 0, `${code} mag niet vanuit v0.5.281 worden gepubliceerd.`);
}
assert.equal(read('data/published/offers/polijstmachines.json').length, 16);
assert.equal(read('data/published/offers/tuinmachines.json').length, 329);
assert.equal(read('data/published/offers/bouwplaats.json').length, 165);
assert.equal(read('data/published/offers/spijkerpistolen.json').length, 49);
assert.equal(read('data/published/offers/frezen.json').length, 48);



const mastertoolsDewaltSpecialistCleaningV0582 = {
  'specialistische-machines': ['DCE560N-XJ','DCE590N-XJ','DCF414NT-XJ','DCS350N-XJ','DCE531N-XJ','DCD240N-XJ','DCG200NT-XJ','DCC018N-XJ','DCS350NT-XJ','DCS496N-XJ','DCF403NT-XJ','DCE580N-XJ','DCE590D1T-QW'],
  reiniging: ['DCV100-XJ','DWV901L-QS','DWV905H-QS','DWV905M-QS','DCV586MN-XJ','DCV586MT2-QW','DCV517N-XJ'],
  spijkerpistolen: ['DCFS950N-XJ','DCN890N-XJ'],
  'haakse-slijpers': ['DCG405FN-XJ'],
  frezen: ['DCW604NT-XJ','DCW600N-XJ','DCE555N-XJ'],
  tuinmachines: ['DCMPS520N-XJ','DCMBL562N-XJ'],
  cirkelzagen: ['DCS525NT-XJ'],
  schroefmachines: ['DCF622N-XJ'],
};
for (const [categoryId, codes] of Object.entries(mastertoolsDewaltSpecialistCleaningV0582)) {
  const sourceOffers = read(`data/offers/${categoryId}.json`);
  const publishedOffers = read(`data/published/offers/${categoryId}.json`);
  for (const code of codes) {
    const variant = variants.find(item => item.categoryId === categoryId && item.matchKeys?.manufacturerSku === code);
    assert.ok(variant, `${code} ontbreekt in ${categoryId}.`);
    assert.equal(variant.setContentsSource, 'Mastertools · Leveringsomvang op de exacte productpagina');
    assert.equal(variant.matchKeys.ean, variant.sourceRef.ean, `${code} heeft een EAN-conflict.`);
    for (const offers of [sourceOffers, publishedOffers]) {
      const offer = offers.find(item => item.merchantId === 'mastertools' && item.manufacturerSku === code);
      assert.ok(offer, `${code} ontbreekt als Mastertools-aanbieding.`);
      assert.equal(offer.ean, variant.matchKeys.ean);
    }
  }
}
for (const code of ['DWE4559-QS','DWE4579-QS','D25430K-QS','DW331KT-QS']) {
  assert.equal(variants.some(item => item.matchKeys?.manufacturerSku === code && item.source === 'tradetracker-mastertools-dewalt-new-execution'), false, `${code} mag niet vanuit v0.5.282 worden gepubliceerd.`);
}
assert.equal(read('data/published/offers/specialistische-machines.json').length, 87);
assert.equal(read('data/published/offers/reiniging.json').length, 121);
assert.equal(read('data/published/offers/spijkerpistolen.json').length, 49);
assert.equal(read('data/published/offers/haakse-slijpers.json').length, 224);
assert.equal(read('data/published/offers/frezen.json').length, 48);
assert.equal(read('data/published/offers/tuinmachines.json').length, 329);
assert.equal(read('data/published/offers/cirkelzagen.json').length, 99);
assert.equal(read('data/published/offers/schroefmachines.json').length, 30);

const mastertoolsDewaltCombisetsV0584 = [
  'DCK2052H2T-QW','DCK2050H2T-QW','DCK2051H2T-QW','DCK276P3T-QW','DCK2062E2T-QW',
  'DCK266P3T-QW','DCK2095D2T-QW','DCK2050E2T-QW','DCMPSH56KIT-QW','DCMST561HT-QW',
  'DCK2051P2T-QW','DCK2200H2T-QW','DPSB2IN1SET','DCK384P2T-QW','DCK368P3T-QW',
  'DCK422P3-QW','DCK623P3-QW','DCK2012P2T-QW','DCK268P2T-QW','DCK266P2T-QW',
  'DCK755P3T-QW','DCK2062M2T-QW','DCK211D2T-QW','DCK2110L2T-QW','DCK480P3T-QW',
  'DCK1012P4T-QW','DCK2080P2T-QW','DCK422P3T-QW','DCK551P3T-QW','DCK685P3T-QW',
  'DCK706P3T-QW','DCK853P4-QW','DCK853P4T-QW','DCK611P1D2-QW','DW0887100-1',
];
for (const code of mastertoolsDewaltCombisetsV0584) {
  const variant = variants.find(item => item.categoryId === 'combisets' && item.matchKeys?.manufacturerSku === code);
  assert.ok(variant, `${code} ontbreekt in combisets.`);
  assert.equal(variant.setContentsSource, 'Mastertools · Leveringsomvang op de exacte productpagina');
  assert.equal(variant.matchKeys.ean, variant.sourceRef.ean, `${code} heeft een EAN-conflict.`);
  for (const prefix of ['data/offers', 'data/published/offers']) {
    const offer = read(`${prefix}/combisets.json`).find(item => item.merchantId === 'mastertools' && item.manufacturerSku === code);
    assert.ok(offer, `${code} ontbreekt als Mastertools-combisetaanbieding.`);
    assert.equal(offer.ean, variant.matchKeys.ean);
  }
}
const toolmaxDewaltCombisetsV0584 = [
  'DCK1012P4T-QW','DCK266P2T-QW','DCK2012P2T-QW','DCK2052H2T-QW','DCK2060D2T-QW',
  'DCK2110L2T-QW','DCK2111L2T','DCK2200H2T-QW','DCK2222MP2T-QW','DCK246P2T-QW',
  'DCK266M2T','DCK266P3T-QW','DCK268P2T-QW','DCK368P3T-QW','DCK384P2T-QW',
  'DCK422P3T-QW','DCK611P1D2-QW','DCK623P3-QW','DCK685P3T-QW','DCK706P3T-QW',
  'DCK755P3T-QW','DCK853P4-QW','DCK853P4T-QW','DCK200MP2T-QW','DCK2020P2T-QW',
  'DCK2050E2T-QW','DCK2050H2T-QW','DCK2051H2T-QW','DCK2051P2T-QW','DCK2062D2T-QW',
  'DCK2062E2T-QW','DCK2062M2T-QW','DCK2080P2T-QW','DCK2095D2T-QW','DCK211D2T-QW',
  'DCK212D2T-QW','DCK276P3T-QW','DCK422P3-QW','DCK480P3T-QW','DCK551P3T-QW',
  'DCK2062P2T','DW0889CG-XJ',
];
for (const code of toolmaxDewaltCombisetsV0584) {
  const variant = variants.find(item => item.categoryId === 'combisets' && item.matchKeys?.manufacturerSku === code);
  assert.ok(variant, `${code} ontbreekt als exacte ToolMax-combisetuitvoering.`);
  for (const prefix of ['data/offers', 'data/published/offers']) {
    const offer = read(`${prefix}/combisets.json`).find(item => item.merchantId === 'toolmax' && item.manufacturerSku === code);
    assert.ok(offer, `${code} ontbreekt als ToolMax-combisetaanbieding.`);
    assert.equal(offer.ean, variant.matchKeys.ean);
  }
}
for (const [categoryId, codes] of Object.entries({
  frezen: ['DCW682P2-QW','DCW604P2-QW'],
  tuinmachines: ['DCMPS520P1-QW','DCMBBL800N-XJ'],
  'specialistische-machines': ['DCS491N-XJ'],
})) {
  for (const code of codes) {
    const variant = variants.find(item => item.categoryId === categoryId && item.matchKeys?.manufacturerSku === code);
    assert.ok(variant, `${code} ontbreekt in ${categoryId}.`);
    assert.equal(variant.setContentsSource, 'Mastertools · Leveringsomvang op de exacte productpagina');
    for (const prefix of ['data/offers', 'data/published/offers']) {
      assert.ok(read(`${prefix}/${categoryId}.json`).some(item => item.manufacturerSku === code), `${code} ontbreekt in ${prefix}/${categoryId}.json`);
    }
  }
}
for (const code of ['DCF801D2-QW','DCS353D2-QW','DCMASED57X1-QW','DCB132X2-QW']) {
  assert.equal(variants.some(item => item.matchKeys?.manufacturerSku === code && item.source === 'tradetracker-mastertools-dewalt-new-execution'), false, `${code} mag niet vanuit v0.5.283 worden gepubliceerd.`);
}
for (const prefix of ['data/offers', 'data/published/offers']) {
  const offers = read(`${prefix}/combisets.json`);
  assert.equal(offers.length, 77, `Onverwacht aantal combisetaanbiedingen in ${prefix}.`);
  assert.equal(offers.filter(item => item.merchantId === 'toolmax').length, 42, `ToolMax-combisets ontbreken in ${prefix}.`);
  assert.equal(offers.filter(item => item.merchantId === 'mastertools').length, 35, `Mastertools-combisets ontbreken in ${prefix}.`);
  assert.equal(read(`${prefix}/bouwplaats.json`).some(item => item.manufacturerSku === 'DW0887100-1'), false, `DW0887100-1 staat nog in bouwplaats bij ${prefix}.`);
}
assert.equal(variants.filter(item => item.categoryId === 'combisets').length, 46, 'Onverwacht aantal exacte combisetuitvoeringen.');
assert.equal(read('data/offers/combisets.json').some(item => item.merchantId === 'mastertools' && item.manufacturerSku === 'DCK246P2T-QW'), false, 'DCK246P2T-QW mag niet als Mastertools-aanbieding live.');

const toolmaxDewaltFinalV0585 = {
  cirkelzagen: ['DCS520T2-QW'],
  bouwplaats: ['DW030PL'],
  'accus-laders': ['DCB115D2-QW'],
};
for (const [categoryId, codes] of Object.entries(toolmaxDewaltFinalV0585)) {
  const sourceOffers = read(`data/offers/${categoryId}.json`);
  const publishedOffers = read(`data/published/offers/${categoryId}.json`);
  for (const code of codes) {
    const variant = variants.find(item => item.categoryId === categoryId && item.matchKeys?.manufacturerSku === code);
    assert.ok(variant, `${code} ontbreekt in de definitieve DeWalt-afronding.`);
    assert.equal(variant.source, 'tradetracker-toolmax-dewalt-final-audit');
    assert.equal(variant.matchKeys.ean, variant.sourceRef.ean, `${code} heeft een EAN-conflict.`);
    for (const offers of [sourceOffers, publishedOffers]) {
      const offer = offers.find(item => item.merchantId === 'toolmax' && item.manufacturerSku === code);
      assert.ok(offer, `${code} ontbreekt als ToolMax-aanbieding.`);
      assert.equal(offer.ean, variant.matchKeys.ean, `${code} heeft een aanbieders-EAN-conflict.`);
    }
  }
}
assert.equal(read('data/offers/cirkelzagen.json').length, 99, 'Onverwacht aantal bronaanbiedingen bij cirkelzagen na DeWalt-eindaudit.');
assert.equal(read('data/published/offers/cirkelzagen.json').length, 99, 'Onverwacht aantal gepubliceerde aanbiedingen bij cirkelzagen na DeWalt-eindaudit.');
assert.equal(read('data/offers/bouwplaats.json').length, 165, 'Onverwacht aantal bronaanbiedingen bij bouwplaats na DeWalt-eindaudit.');
assert.equal(read('data/published/offers/bouwplaats.json').length, 165, 'Onverwacht aantal gepubliceerde aanbiedingen bij bouwplaats na DeWalt-eindaudit.');
assert.equal(read('data/offers/accus-laders.json').length, 201, 'Onverwacht aantal bronaanbiedingen bij accu’s en laders na DeWalt-eindaudit.');
assert.equal(read('data/published/offers/accus-laders.json').length, 201, 'Onverwacht aantal gepubliceerde aanbiedingen bij accu’s en laders na DeWalt-eindaudit.');
const dewaltFinalAudit = read('data/review/dewalt-final-audit-v0_5_285.json');
assert.equal(dewaltFinalAudit.summary.reviewedQueueItems, 159, 'DeWalt-eindaudit mist wachtrijregels.');
assert.equal(dewaltFinalAudit.summary.publishedNow, 3, 'Onverwacht aantal nieuwe uitvoeringen in de DeWalt-eindaudit.');
assert.equal(
  dewaltFinalAudit.summary.publishedNow
    + dewaltFinalAudit.summary.alreadyPublished
    + dewaltFinalAudit.summary.excludedAccessories
    + dewaltFinalAudit.summary.excludedOutOfScope
    + dewaltFinalAudit.summary.blockedSource
    + dewaltFinalAudit.summary.blockedIdentityConflict,
  dewaltFinalAudit.summary.reviewedQueueItems,
  'Niet alle DeWalt-wachtrijregels hebben een definitieve beslissing.'
);

const audit = computeCatalogConsolidationAudit(root);
assert.equal(audit.summary.hardErrors, 0, 'Categoriecorrecties veroorzaken harde catalogusfouten.');
assert.equal(audit.summary.highConfidenceCategorySuggestions, 0, 'Er staan nog categorievoorstellen met hoge zekerheid open.');
assert.equal(audit.summary.platformConflicts, 0, 'Er staan nog platform- of voltageconflicten open.');
assert.equal(audit.counts.productGroups, 1423, 'Onverwacht aantal productgroepen na Bosch Professional-batch 2.');
assert.equal(audit.counts.variants, 2103, 'Onverwacht aantal uitvoeringen na Bosch Professional-batch 2.');
assert.equal(audit.counts.publishedOffers, 2314, 'Onverwacht aantal aanbiedingen na Bosch Professional-batch 2.');
const boschBatch2 = read('data/review/mastertools-bosch-professional-batch-2-v0_5_352.json');
assert.equal(boschBatch2.summary.reviewedProducts, 40, 'Bosch Professional-batch 2 moet exact 40 producten bevatten.');
assert.equal(boschBatch2.summary.newProductGroups, 9, 'Onverwacht aantal nieuwe Bosch-basismodellen in batch 2.');
assert.equal(boschBatch2.summary.newVariants, 37, 'Onverwacht aantal nieuwe Bosch-uitvoeringen in batch 2.');
assert.equal(boschBatch2.summary.updatedExistingVariants, 3, 'Onverwacht aantal bijgewerkte Bosch-uitvoeringen in batch 2.');
assert.equal(boschBatch2.summary.newOffers, 40, 'Onverwacht aantal Mastertools-aanbiedingen in Bosch-batch 2.');
assert.equal(boschBatch2.excludedSourceConflicts.length, 2, 'Bosch-batch 2 moet twee bronconflicten behouden.');
assert.equal(boschBatch2.deferred.length, 1, 'Bosch-batch 2 moet één gecombineerde set uitstellen.');
const batch2Codes = new Set(boschBatch2.records.map(record => record.code));
assert.equal(batch2Codes.size, 40, 'Bosch-batch 2 bevat dubbele artikelcodes.');
const reviewQueue = read('data/automation/review/new-products.json').items;
for (const code of batch2Codes) assert.equal(reviewQueue.some(item => item.code === code), false, `Gepubliceerde Bosch-uitvoering ${code} staat nog in de reviewwachtrij.`);
for (const code of ['06019K4001', '0611927101', '0615A5007K']) assert.equal(reviewQueue.some(item => item.code === code), true, `Uitgesloten of uitgestelde Bosch-uitvoering ${code} ontbreekt in de reviewwachtrij.`);
const productInformation = read('data/product-information.json').entries;
for (const groupId of new Set(boschBatch2.records.map(record => record.groupId))) {
  const entry = productInformation[groupId];
  assert.ok(entry?.sections?.description?.text, `Productomschrijving ontbreekt voor ${groupId}.`);
  assert.ok((entry?.sections?.features?.items || []).length >= 4, `Te weinig bijzondere kenmerken voor ${groupId}.`);
  assert.ok((entry?.sections?.technical?.rows || []).length >= 5, `Te weinig technische gegevens voor ${groupId}.`);
}
console.log('✓ Categorie- en platformcorrecties, DeWalt-afronding en Bosch Professional Mastertools-batches 1 en 2 gevalideerd.');
