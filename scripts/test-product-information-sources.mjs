import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const readJson = relative => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
const groups = readJson('data/product-groups.json');
const registry = readJson('data/product-information-sources.json');
const information = readJson('data/product-information.json');
const canonicalAudit = readJson('data/product-information-audit.json');
const gapAudit = readJson('data/review/product-information-source-gaps.json');

assert.equal(registry?.schemaVersion, 'canonical-product-information-sources-v2', 'Sectiegerichte bronnenregistratie ontbreekt.');
assert.equal(gapAudit?.schemaVersion, 'product-information-source-gaps-v1', 'Bronnenaudit ontbreekt.');
const groupIds = new Set(groups.map(group => group.id));
for (const [groupId, entry] of Object.entries(registry.entries || {})) {
  assert.ok(groupIds.has(groupId), `Onbekend basismodel in bronnenregistratie: ${groupId}`);
  assert.equal(entry.groupId, groupId, `Bronregistratie gebruikt geen canonieke groupId: ${groupId}`);
  for (const [sectionKey, section] of Object.entries(entry.sections || {})) {
    assert.ok(['description', 'features', 'technical'].includes(sectionKey), `Onbekende verrijkingssectie: ${groupId}/${sectionKey}`);
    assert.equal(section.strategy, 'replace', `Alleen expliciete section replace is toegestaan: ${groupId}/${sectionKey}`);
    assert.equal(section.source?.status, 'verified', `Bronstatus ontbreekt: ${groupId}/${sectionKey}`);
    assert.match(section.source?.url || '', /^https:\/\//, `Bron-URL ontbreekt: ${groupId}/${sectionKey}`);
  }
}

const gks = information.entries?.['bosch-professional-gks-18v-57-2-gx-profess'];
assert.ok(gks, 'Bosch GKS 18V-57-2 GX ontbreekt uit canonieke productinformatie.');
assert.deepEqual(gks.sections.features.items, [
  'Maakt precisiewerk met nauwkeurige zaagsneden onder hoek mogelijk in alle zaagposities.',
  'Mobiel gebruik voor allerlei toepassingen dankzij compatibiliteit met Bosch geleiderail FSN en afkortgeleiderailsysteem FSN X.',
  'Maximaliseert vermogen en precisie met robuuste borstelloze motor.'
], 'Bosch GKS 18V-57-2 GX kenmerken moeten volledig uit de officiële bron komen.');
assert.equal(gks.sections.features.source.sourceType, 'official-manufacturer', 'Bosch GKS bron moet officieel zijn.');
assert.ok(gks.sections.technical.rows.length >= 6, 'Bosch GKS officiële technische gegevens ontbreken.');
assert.equal(gapAudit.summary.resolvedByExternalSource.features >= 1, true, 'Bronnenaudit registreert geen verrijkte kenmerken.');
assert.equal(gapAudit.summary.resolvedByExternalSource.technical >= 1, true, 'Bronnenaudit registreert geen verrijkte technische gegevens.');



const makitaJigsaws = ['makita-4351ct', 'makita-djv180', 'makita-djv184', 'makita-djv186', 'makita-m4301'];
for (const groupId of makitaJigsaws) {
  const entry = information.entries?.[groupId];
  assert.ok(entry, `Makita decoupeerzaag ontbreekt: ${groupId}`);
  assert.ok(entry.sections?.description?.text?.length >= 45, `Makita decoupeerzaag mist productomschrijving: ${groupId}`);
  assert.ok(entry.sections?.features?.items?.length >= 3, `Makita decoupeerzaag mist kenmerken: ${groupId}`);
  assert.ok(entry.sections?.technical?.rows?.length >= 8, `Makita decoupeerzaag mist technische gegevens: ${groupId}`);
  for (const sectionName of ['description', 'features', 'technical']) {
    assert.equal(entry.sections?.[sectionName]?.source?.sourceType, 'official-manufacturer', `Makita decoupeerzaag gebruikt voor ${sectionName} geen officiële bron: ${groupId}`);
  }
}
const djv184 = information.entries?.['makita-djv184'];
assert.equal(djv184.sections.description.source.sourceType, 'official-manufacturer', 'DJV184 omschrijving moet uit officiële Makita-bron komen.');
assert.equal(djv184.sections.features.items.length, 13, 'DJV184 moet alle 13 officiële kenmerken tonen.');
assert.ok(djv184.sections.technical.rows.length >= 25, 'DJV184 mist officiële technische gegevens.');

console.log(`✓ Sectiegerichte bronverrijking actief: ${Object.keys(registry.entries || {}).length} basismodel(len) met officiële of tweede gecontroleerde bron; GKS 18V-57-2 GX is volledig verrijkt.`);

const makitaEnergyBatch = {
  'makita-bl1015k': {
    sections: ['technical'],
    sourceUrl: 'https://www.makita.nl/artikel/makita-1913u9-9-accu-bl1015k-10-8v-1-5ah.html',
    technicalRows: [
      ['Accu type', 'Li-ion (Lithium-ion)'],
      ['Ampère-uur', '1,5 Ah']
    ]
  },
  'makita-dc18sd': {
    sections: ['description', 'technical'],
    sourceUrl: 'https://www.makita.nl/artikel/makita-194533-6-lader-lxt-dc18sd.html',
    technicalRows: [
      ['Modelnr.', 'DC18SD'],
      ['Output (DC)', '7,2 - 18 V']
    ]
  },
  'makita-dc18sh': {
    sections: ['description', 'technical'],
    sourceUrl: 'https://www.makita.nl/artikel/makita-199687-4-duo-lader-lxt-dc18sh.html',
    technicalRows: [
      ['Modelnr.', 'DC18SH'],
      ['Output (DC)', '14,4 - 18 V']
    ]
  }
};
for (const [groupId, expected] of Object.entries(makitaEnergyBatch)) {
  const entry = information.entries?.[groupId];
  assert.ok(entry, `Makita energieproduct ontbreekt: ${groupId}`);
  assert.ok(expected.sections.every(sectionName => entry.sections?.[sectionName]), `Makita energieproduct mist een eerder vastgelegde officiële sectie: ${groupId}`);
  for (const sectionName of expected.sections) {
    const source = entry.sections?.[sectionName]?.source;
    assert.equal(source?.sourceType, 'official-manufacturer', `Makita energieproduct gebruikt voor ${sectionName} geen officiële bron: ${groupId}`);
    assert.equal(source?.manufacturer, 'Makita Nederland', `Makita energieproduct heeft een onjuiste fabrikantbron: ${groupId}/${sectionName}`);
    assert.equal(source?.url, expected.sourceUrl, `Makita energieproduct heeft een onjuiste officiële pagina: ${groupId}/${sectionName}`);
  }
  const rows = entry.sections?.technical?.rows || [];
  for (const [label, value] of expected.technicalRows) {
    assert.ok(rows.some(row => row.label === label && row.value === value), `Makita energieproduct mist officiële technische regel ${label}: ${groupId}`);
  }
}

const makitaStandaloneChargers = {
  'makita-194621-9': {
    sections: ['description', 'technical'],
    sourceUrl: 'https://www.makita.nl/artikel/makita-194621-9-auto-lader-lxt-dc18se.html',
    technicalRows: [
      ['Modelnr.', 'DC18SE'],
      ['Type lader', 'Auto lader'],
      ['Output (DC)', '7,2 - 18 V']
    ]
  },
  'makita-195584-2': {
    sections: ['description', 'technical'],
    sourceUrl: 'https://www.makita.nl/artikel/makita-195584-2-snellader-lxt-dc18rc.html',
    technicalRows: [
      ['Modelnr.', 'DC18RC'],
      ['Type lader', 'Snellader'],
      ['Laadstroom', '9 A']
    ]
  },
  'makita-191m90-3': {
    sections: ['description', 'features', 'technical'],
    sourceUrl: 'https://www.makita.nl/artikel/makita-191m90-3-lader-xgt-dc40rc.html',
    technicalRows: [
      ['Modelnr.', 'DC40RC'],
      ['Platform', 'XGT 40 V Max'],
      ['Laadstroom', '4 A']
    ],
    features: [
      'LXT-compatibel via de optionele laadadapter ADP10.',
      'Melodie speelt af wanneer accu volledig geladen is.',
      'Geïntegreerde koelventilator zorgt voor minder warmteontwikkeling.',
      'Geschikt voor wandmontage.',
      'Duidelijke LED-verlichting in drie kleuren voor oplaadindicatie.'
    ]
  }
};
for (const [groupId, expected] of Object.entries(makitaStandaloneChargers)) {
  const entry = information.entries?.[groupId];
  assert.ok(entry, `Makita losse lader ontbreekt: ${groupId}`);
  assert.ok(expected.sections.every(sectionName => entry.sections?.[sectionName]), `Makita losse lader mist een eerder vastgelegde officiële sectie: ${groupId}`);
  for (const sectionName of expected.sections) {
    const source = entry.sections?.[sectionName]?.source;
    assert.equal(source?.sourceType, 'official-manufacturer', `Makita losse lader gebruikt voor ${sectionName} geen officiële bron: ${groupId}`);
    assert.equal(source?.manufacturer, 'Makita Nederland', `Makita losse lader heeft een onjuiste fabrikantbron: ${groupId}/${sectionName}`);
    assert.equal(source?.url, expected.sourceUrl, `Makita losse lader heeft een onjuiste officiële pagina: ${groupId}/${sectionName}`);
  }
  const rows = entry.sections?.technical?.rows || [];
  for (const [label, value] of expected.technicalRows) {
    assert.ok(rows.some(row => row.label === label && row.value === value), `Makita losse lader mist officiële technische regel ${label}: ${groupId}`);
  }
  if (expected.features) {
    assert.deepEqual(entry.sections?.features?.items, expected.features, `Makita DC40RC moet alle vijf officiële gebruikersvoordelen tonen.`);
  }
}

const makitaStandaloneBatteries = {
  'makita-197396-9': {
    sections: ['description', 'features', 'technical'],
    sourceUrl: 'https://www.makita.nl/artikel/makita-197396-9-accu-bl1021b-cxt-12-v-max-2-0-ah.html',
    technicalRows: [
      ['Platform', 'CXT 12 V Max'],
      ['Ampère-uur', '2,0 Ah'],
      ['Modelnr.', 'BL1021B']
    ],
    features: [
      'Bijzonder compact en vooral licht van gewicht.',
      'Groots in klein werk.',
      'Voorzien van multi-contacten om het vermogen goed naar de machine over te brengen.',
      'Geïntegreerde acculadingindicator maakt het resterende energieniveau zichtbaar.'
    ]
  },
  'makita-197406-2': {
    sections: ['description', 'features', 'technical'],
    sourceUrl: 'https://www.makita.nl/artikel/makita-197406-2-accu-bl1041b-cxt-12-v-max-4-0-ah.html',
    technicalRows: [
      ['Platform', 'CXT 12 V Max'],
      ['Ampère-uur', '4,0 Ah'],
      ['Modelnr.', 'BL1041B']
    ],
    features: [
      'Groots in klein werk.',
      'Voorzien van multi-contacten om het vermogen goed naar de machine over te brengen.',
      'CXT 12 V Max Li-ion schuifaccu met een capaciteit van 4,0 Ah.',
      'Geïntegreerde acculadingindicator maakt het resterende energieniveau zichtbaar.'
    ]
  },
  'makita-197254-9': {
    sections: ['description', 'technical'],
    sourceUrl: 'https://www.makita.nl/artikel/makita-197254-9-accu-bl1820b-lxt-18-v-2-0ah.html',
    technicalRows: [
      ['Platform', 'LXT 18 V'],
      ['Ampère-uur', '2,0 Ah'],
      ['Modelnr.', 'BL1820B']
    ]
  },
  'makita-197280-8': {
    sections: ['description', 'technical'],
    sourceUrl: 'https://www.makita.nl/artikel/makita-197280-8-accu-bl1850b-lxt-18-v-5-0ah.html',
    technicalRows: [
      ['Platform', 'LXT 18 V'],
      ['Ampère-uur', '5,0 Ah'],
      ['Modelnr.', 'BL1850B']
    ]
  },
  'makita-197422-4': {
    sections: ['description', 'technical'],
    sourceUrl: 'https://www.makita.nl/artikel/makita-197422-4-accu-bl1860b-lxt-18-v-6-0ah.html',
    technicalRows: [
      ['Platform', 'LXT 18 V'],
      ['Ampère-uur', '6,0 Ah'],
      ['Modelnr.', 'BL1860B']
    ]
  },
  'makita-197599-5': {
    sections: ['description', 'technical'],
    sourceUrl: 'https://www.makita.nl/artikel/makita-197599-5-accu-bl1830b-lxt-18-v-3-0ah.html',
    technicalRows: [
      ['Platform', 'LXT 18 V'],
      ['Ampère-uur', '3,0 Ah'],
      ['Modelnr.', 'BL1830B']
    ]
  }
};
for (const [groupId, expected] of Object.entries(makitaStandaloneBatteries)) {
  const entry = information.entries?.[groupId];
  assert.ok(entry, `Makita losse accu ontbreekt: ${groupId}`);
  assert.ok(expected.sections.every(sectionName => entry.sections?.[sectionName]), `Makita losse accu mist een eerder vastgelegde officiële sectie: ${groupId}`);
  for (const sectionName of expected.sections) {
    const source = entry.sections?.[sectionName]?.source;
    assert.equal(source?.sourceType, 'official-manufacturer', `Makita losse accu gebruikt voor ${sectionName} geen officiële bron: ${groupId}`);
    assert.equal(source?.manufacturer, 'Makita Nederland', `Makita losse accu heeft een onjuiste fabrikantbron: ${groupId}/${sectionName}`);
    assert.equal(source?.url, expected.sourceUrl, `Makita losse accu heeft een onjuiste officiële pagina: ${groupId}/${sectionName}`);
  }
  const rows = entry.sections?.technical?.rows || [];
  for (const [label, value] of expected.technicalRows) {
    assert.ok(rows.some(row => row.label === label && row.value === value), `Makita losse accu mist officiële technische regel ${label}: ${groupId}`);
  }
  if (expected.features) {
    assert.deepEqual(entry.sections?.features?.items, expected.features, `Makita CXT-accu moet alle officiële gebruikersvoordelen tonen: ${groupId}`);
  }
}

console.log('✓ Makita Accu’s & Laders v0.5.109–v0.5.112 bewaart de eerder vastgelegde officiële gegevens en houdt accu-/laderinformatie gescheiden van setinhoud.');


const makitaOfficialStartsetsV122 = {
  'makita-pskgpe2j': {
    sections: ['description'],
    sourceUrl: 'https://www.makita.nl/artikel/makita-pskgpe2j-startset-dc40rb-2x-bl4080h.html'
  },
  'makita-191j65-4': {
    sections: ['description', 'technical'],
    sourceUrl: 'https://www.makita.nl/artikel/makita-191j65-4-startset-xgt-dc40ra-1x-bl4040.html',
    technicalRows: [['Platform', 'XGT 40 V Max'], ['Type lader', 'Snellader'], ['Volt (spanning)', '36 V']]
  },
  'makita-191v27-4': {
    sections: ['description', 'technical'],
    sourceUrl: 'https://www.makita.nl/artikel/makita-191v27-4-startset-xgt-dc40rc-2x-bl4025.html',
    technicalRows: [['Platform', 'XGT 40 V Max'], ['Type lader', 'Lader'], ['Volt (spanning)', '36 V']]
  },
  'makita-1915d9-2': {
    sections: ['description', 'technical'],
    sourceUrl: 'https://www.makita.nl/artikel/makita-1915d9-2-startset-xgt-dc40ra-1x-bl4040f.html',
    technicalRows: [['Platform', 'XGT 40 V Max'], ['Type lader', 'Snellader'], ['Volt (spanning)', '36 V']]
  },
  'makita-197658-5': {
    sections: ['description', 'technical'],
    sourceUrl: 'https://www.makita.nl/artikel/makita-197658-5-startset-cxt-dc10sb-2x-bl1021b.html',
    technicalRows: [['Platform', 'CXT 12 V Max'], ['Type lader', 'Lader'], ['Volt (spanning)', '10,8 V']]
  },
  'makita-198077-8': {
    sections: ['description', 'technical'],
    sourceUrl: 'https://www.makita.nl/artikel/makita-198077-8-startset-lxt-dc18rd-2x-bl1860b.html',
    technicalRows: [['Platform', 'LXT 18 V'], ['Type lader', 'Duosnellader'], ['Volt (spanning)', '18 V']]
  }
};
for (const [groupId, expected] of Object.entries(makitaOfficialStartsetsV122)) {
  const entry = information.entries?.[groupId];
  assert.ok(entry, `Makita officiële startset ontbreekt: ${groupId}`);
  assert.ok(expected.sections.every(sectionName => entry.sections?.[sectionName]), `Makita startset mist een eerder vastgelegde officiële sectie: ${groupId}`);
  for (const sectionName of expected.sections) {
    const source = entry.sections?.[sectionName]?.source;
    assert.equal(source?.sourceType, 'official-manufacturer', `Makita startset gebruikt voor ${sectionName} geen officiële bron: ${groupId}`);
    assert.equal(source?.manufacturer, 'Makita Nederland', `Makita startset heeft een onjuiste fabrikantbron: ${groupId}/${sectionName}`);
    assert.equal(source?.url, expected.sourceUrl, `Makita startset heeft een onjuiste officiële pagina: ${groupId}/${sectionName}`);
  }
  assert.ok(entry.sections?.description?.text?.length >= 45, `Makita startset mist een bruikbare officiële omschrijving: ${groupId}`);
  for (const [label, value] of expected.technicalRows || []) {
    assert.ok(entry.sections?.technical?.rows?.some(row => row.label === label && row.value === value), `Makita startset mist officiële technische regel ${label}: ${groupId}`);
  }
}
console.log('✓ Makita Accu & Lader v0.5.122 bewaart de eerder vastgelegde officiële product- en technische gegevens; uitvoeringinhoud blijft apart.');

const makitaOfficialEnergyV124 = {
  'makita-195095-7': {
    sections: ['description', 'technical'],
    sourceUrl: 'https://www.makita.nl/artikel/makita-195095-7-accu-bl1830-lxt-18v-3ah-duopack.html',
    technicalRows: [
      ['Ampère-uur', '3,0 Ah'],
      ['Volt (spanning)', '18 V'],
      ['Gewicht', '0,60 kg']
    ]
  },
  'makita-198186-3': {
    sections: ['description', 'technical'],
    sourceUrl: 'https://www.makita.nl/artikel/makita-198186-3-accu-bl1815g-18v-1-5ah.html',
    technicalRows: [
      ['Platform', 'G 18 V'],
      ['Modelnr.', 'BL1815G'],
      ['Gewicht', '0,39 kg']
    ]
  },
  'makita-199687-4': {
    sections: ['description', 'technical'],
    sourceUrl: 'https://www.makita.nl/artikel/makita-199687-4-duo-lader-lxt-dc18sh.html',
    technicalRows: [
      ['Type lader', 'Duo lader'],
      ['Modelnr.', 'DC18SH'],
      ['Output (DC)', '14,4 - 18 V']
    ]
  }
};
for (const [groupId, expected] of Object.entries(makitaOfficialEnergyV124)) {
  const entry = information.entries?.[groupId];
  assert.ok(entry, `Makita v0.5.124 energieproduct ontbreekt: ${groupId}`);
  assert.ok(expected.sections.every(sectionName => entry.sections?.[sectionName]), `Makita v0.5.124 energieproduct mist een eerder vastgelegde officiële sectie: ${groupId}`);
  for (const sectionName of expected.sections) {
    const source = entry.sections?.[sectionName]?.source;
    assert.equal(source?.sourceType, 'official-manufacturer', `Makita v0.5.124 gebruikt geen officiële bron: ${groupId}/${sectionName}`);
    assert.equal(source?.manufacturer, 'Makita Nederland', `Makita v0.5.124 heeft een onjuiste fabrikantbron: ${groupId}/${sectionName}`);
    assert.equal(source?.url, expected.sourceUrl, `Makita v0.5.124 heeft een onjuiste officiële pagina: ${groupId}/${sectionName}`);
  }
  for (const [label, value] of expected.technicalRows) {
    assert.ok(entry.sections?.technical?.rows?.some(row => row.label === label && row.value === value), `Makita v0.5.124 mist officiële technische regel ${label}: ${groupId}`);
  }
  assert.equal(entry.sections?.features?.source?.sourceType, 'official-manufacturer', `Makita v0.5.124 uitbreiding gebruikt geen officiële kenmerkenbron: ${groupId}`);
}
console.log('✓ Makita Accu & Lader v0.5.124 bewaart de eerder vastgelegde officiële omschrijving en technische gegevens; latere officiële kenmerkenuitbreiding blijft toegestaan.');

// Makita expanded-content regression coverage is consolidated here.
// This keeps the content safeguards active without adding release-specific
// scripts to the professional scripts directory.
const makitaExpandedContentBatchIds = [
  'makita-1910g0-1', 'makita-1913s3-7', 'makita-1913w2-7', 'makita-1915d9-2', 'makita-191j65-4',
  'makita-191n69-0', 'makita-191n76-3', 'makita-191v27-4', 'makita-193533-3', 'makita-194533-6',
  'makita-194588-1', 'makita-194621-9', 'makita-195095-7', 'makita-195423-6', 'makita-195443-0',
  'makita-195445-6', 'makita-195584-2', 'makita-196235-0', 'makita-196367-3', 'makita-196399-0',
  'makita-196462-9', 'makita-196671-0', 'makita-196875-4', 'makita-197254-9', 'makita-197280-8',
  'makita-197343-0', 'makita-197355-3', 'makita-197363-4', 'makita-197422-4', 'makita-197599-5',
  'makita-197658-5', 'makita-198077-8', 'makita-198186-3', 'makita-199687-4', 'makita-bl1015k',
  'makita-dc18sd', 'makita-dc18sh', 'makita-pskgpe2j',
  'makita-af505', 'makita-bo4565', 'makita-cf101', 'makita-dbo482', 'makita-dcf102', 'makita-dcf301',
  'makita-decdml807', 'makita-dml801', 'makita-hg5030', 'makita-jr103', 'makita-m4000', 'makita-m9204',
  'makita-mp100', 'makita-rt001g', 'makita-sk700', 'makita-um600',
  'makita-ddf482', 'makita-ddf485', 'makita-ddf490', 'makita-ddf492', 'makita-df033', 'makita-df331',
  'makita-df333', 'makita-dhp458', 'makita-dhp482', 'makita-dhp485', 'makita-dhp487', 'makita-dhp489',
  'makita-dhp492', 'makita-dp4020', 'makita-dp4021', 'makita-hp333', 'makita-hp488', 'makita-m6200',
  'makita-m8101', 'makita-m8103', 'makita-m8104',
  'makita-dlm330', 'makita-dlm530', 'makita-dlm532', 'makita-dlm538', 'makita-dub185', 'makita-dub186',
  'makita-duc254', 'makita-duh483', 'makita-ub002g', 'makita-ub005g', 'makita-ub101', 'makita-uh004g',
  'makita-uh006g', 'makita-uh023g', 'makita-uh201', 'makita-ur006g',
  'makita-cl001g', 'makita-cl002g', 'makita-cl004g', 'makita-cl070', 'makita-cl072', 'makita-cl108',
  'makita-cl183', 'makita-dcl181', 'makita-dhw080', 'makita-dvc261', 'makita-vc008g', 'makita-vc011g',
  'makita-vs001g',
  'makita-dga511', 'makita-dgd800', 'makita-ga029g', 'makita-ga038g', 'makita-ga055g', 'makita-ga5030',
  'makita-ga9020', 'makita-gd0810', 'makita-m9503',
  'makita-dhr202', 'makita-dhr242', 'makita-dhr243', 'makita-hr005g', 'makita-hr007g', 'makita-hr012g',
  'makita-hr5212', 'makita-m8600', 'makita-m8700',
  'makita-1915t9-4', 'makita-197396-9', 'makita-197406-2', 'makita-4351ct', 'makita-cp100',
  'makita-dbo180', 'makita-dbo480', 'makita-dbs180', 'makita-dcs551', 'makita-deadml809',
  'makita-deadml816', 'makita-deaml002g', 'makita-deaml006g', 'makita-dfl301', 'makita-dfr750',
  'makita-dfs250', 'makita-dfs251', 'makita-djv184', 'makita-dmr112', 'makita-drv150',
  'makita-drv250', 'makita-dss610', 'makita-dtd152', 'makita-dtd153', 'makita-dtd156',
  'makita-dtd173', 'makita-dtl063', 'makita-dtw190', 'makita-dtw301', 'makita-dtw700',
  'makita-hs6601', 'makita-m3702', 'makita-m9203', 'makita-m9800', 'makita-mr001g',
  'makita-tr001g', 'makita-tw002g', 'makita-tw009g',
  'makita-dhr171', 'makita-dhr182', 'makita-dhr183', 'makita-dhr241', 'makita-dhr264',
  'makita-dhr281', 'makita-dhr400', 'makita-hk0500', 'makita-hm0810t', 'makita-hm0871c',
  'makita-hm1101c', 'makita-hm1203c', 'makita-hm1213c', 'makita-hm1214c', 'makita-hm1812',
  'makita-hr002g', 'makita-hr003g', 'makita-hr006g', 'makita-hr008g', 'makita-hr009g',
  'makita-hr010g', 'makita-hr166d', 'makita-hr1841f', 'makita-hr2300', 'makita-hr2470',
  'makita-hr2600', 'makita-hr2601', 'makita-hr2630', 'makita-hr2631f', 'makita-hr2652',
  'makita-hr3011fc', 'makita-hr3210fc', 'makita-hr4002', 'makita-hr4013c', 'makita-hr4510c',
  'makita-hr5202c', 'makita-da3010f', 'makita-da3011f', 'makita-da333d', 'makita-da4031',
  'makita-9032', 'makita-9046', 'makita-9403', 'makita-9404', 'makita-9741',
  'makita-9903', 'makita-9911', 'makita-9920', 'makita-bo001', 'makita-bo002',
  'makita-bo003', 'makita-bo004', 'makita-bo005', 'makita-bo007cg', 'makita-bo4900v',
  'makita-bo5030', 'makita-bo5031', 'makita-bo5041', 'makita-bo6030', 'makita-bo6050',
  'makita-bs001', 'makita-dbo380', 'makita-dbo381', 'makita-dbo382', 'makita-dbo481',
  'makita-dbo484', 'makita-dsl801', 'makita-gv7000', 'makita-m9400b', 'makita-1806b',
  'makita-dkp180', 'makita-dkp181', 'makita-kp001g', 'makita-kp0800', 'makita-kp0810',
  'makita-kp0810c', 'makita-kp312s', 'makita-m1901b', 'makita-n1923b', 'makita-2704',
  'makita-4131', 'makita-5008', 'makita-5103', 'makita-5143', 'makita-5903',
  'makita-cs002', 'makita-dcs552', 'makita-dcs553', 'makita-dhs660', 'makita-dhs661',
  'makita-dhs680', 'makita-dhs710', 'makita-dhs782', 'makita-dhs783', 'makita-drs780',
  'makita-dsp600', 'makita-dsp601', 'makita-dss501', 'makita-hs003', 'makita-hs004',
  'makita-hs009', 'makita-hs011', 'makita-hs012', 'makita-hs013', 'makita-hs0600',
  'makita-hs7601', 'makita-m5802b', 'makita-n5900b', 'makita-rs001', 'makita-rs002',
  'makita-sp001', 'makita-sp6000', 'makita-4329k', 'makita-4350fct', 'makita-4351fct',
  'makita-djv142', 'makita-djv181', 'makita-djv182', 'makita-djv185', 'makita-jv001g',
  'makita-dda350', 'makita-dda351', 'makita-dda450', 'makita-dda460', 'makita-ddf083',
  'makita-ddf484', 'makita-ddf487', 'makita-ddf489', 'makita-df002', 'makita-df003',
  'makita-df032', 'makita-df032d', 'makita-df332', 'makita-dhp484', 'makita-dhp490',
  'makita-dp2011', 'makita-ds4012', 'makita-dtp141', 'makita-hb350', 'makita-hb500',
  'makita-hp001', 'makita-hp002', 'makita-hp1631', 'makita-hp2051', 'makita-hp2071',
  'makita-dtd154', 'makita-dtd157', 'makita-dtd158', 'makita-dtl061', 'makita-dts141',
  'makita-td003g', 'makita-td022', 'makita-td023', 'makita-td111', 'makita-tl064',
  'makita-dtl300', 'makita-dtl301', 'makita-dtw1001', 'makita-dtw1002', 'makita-dtw1005',
  'makita-dga452', 'makita-dga505', 'makita-dga506', 'makita-dga508', 'makita-dga512',
  'makita-dga513', 'makita-dga514', 'makita-dga517', 'makita-dga518', 'makita-dga519',
  'makita-dga520', 'makita-dga521', 'makita-dga700', 'makita-dga901', 'makita-dgd801',
  'makita-dmc300', 'makita-ga005', 'makita-ga013', 'makita-ga016', 'makita-ga023',
  'makita-ga026', 'makita-ga032', 'makita-ga035', 'makita-ga036', 'makita-ga037gz04',
  'makita-ga041', 'makita-ga044', 'makita-ga047', 'makita-ga050', 'makita-ga051',
  'makita-ga056', 'makita-ga5021', 'makita-ga5040', 'makita-ga5041', 'makita-ga5050',
  'makita-ga5080', 'makita-ga5090', 'makita-ga5091', 'makita-ga5092', 'makita-ga5093',
  'makita-an454', 'makita-dbn500', 'makita-dbn501', 'makita-dbn600', 'makita-dbn601',
  'makita-dbn610', 'makita-dbn620', 'makita-dbn900', 'makita-dbn901', 'makita-dfn350',
  'makita-dpt353', 'makita-dst112', 'makita-dst221', 'makita-fn001g', 'makita-gn900',
  'makita-pt001g', 'makita-djr183', 'makita-djr186', 'makita-djr187', 'makita-djr188',
  'makita-djr189', 'makita-djr360', 'makita-jr001g', 'makita-jr002g', 'makita-jr003g',
  'makita-jr3070ct', 'makita-dtm52', 'makita-dtm53', 'makita-tm3010', 'makita-tm30d',
  'makita-jv002g', 'makita-jv0600k', 'makita-jv101d', 'makita-jv103d', 'makita-dpo600',
  'makita-dpv300', 'makita-po6000', 'makita-ps001', 'makita-pv001', 'makita-sa5040',
  'makita-dtw180', 'makita-dtw181', 'makita-dtw251', 'makita-dtw300', 'makita-dtw302',
  'makita-dtw450', 'makita-dtw701', 'makita-tw001g', 'makita-tw004g', 'makita-tw005g',
  'makita-tw007g', 'makita-tw008g', 'makita-tw010g', 'makita-tw011g', 'makita-tw060d',
  'makita-dwr180', 'makita-dls111', 'makita-dls211', 'makita-dls600', 'makita-dls714n',
  'makita-lc1230n', 'makita-ls002', 'makita-ls003', 'makita-ls004', 'makita-ls0714ln',
  'makita-ls0815fln', 'makita-ls0816f', 'makita-ls1018ln', 'makita-ls1019l', 'makita-ls1040n',
  'makita-ls1110f', 'makita-lw1400', 'makita-m2402b', 'makita-mls100n', 'makita-df001',
  'makita-dfr452', 'makita-dfr550', 'makita-dfr551', 'makita-dfr552', 'makita-dfs452',
  'makita-3707f', 'makita-3711', 'makita-dco180', 'makita-dco181', 'makita-dpj180',
  'makita-drt50', 'makita-drt52', 'makita-m3601b', 'makita-m3602b', 'makita-pj7000',
  'makita-rp001g', 'makita-rp0900', 'makita-rp1111c', 'makita-rp1802', 'makita-rp2302fc',
  'makita-rp2303fc', 'makita-rt0702', 'makita-cg100d', 'makita-dcg180', 'makita-dgp180',
  'makita-djn161', 'makita-djs101', 'makita-djs130', 'makita-djs131', 'makita-djs161',
  'makita-djs200', 'makita-djs800', 'makita-dsc121', 'makita-dsc163', 'makita-dtc100',
  'makita-dtc101', 'makita-dtc102', 'makita-dtc103', 'makita-dtc104', 'makita-dut130',
  'makita-gp001g', 'makita-jn3201', 'makita-js1602', 'makita-js3201', 'makita-js8000',
  'makita-as001', 'makita-das180', 'makita-dcu180', 'makita-dcu601', 'makita-dcu602', 'makita-ddg460', 'makita-ddg461', 'makita-dg001', 'makita-dg002', 'makita-dlm382', 'makita-dlm432', 'makita-dlm463', 'makita-dlm480', 'makita-dlm481', 'makita-dlm533', 'makita-dlm536', 'makita-dlm539', 'makita-dua200', 'makita-dua300', 'makita-dub184', 'makita-dub187', 'makita-dub361', 'makita-dub362', 'makita-dub363', 'makita-dub363zv', 'makita-duc150', 'makita-duc256', 'makita-duc306', 'makita-duc307', 'makita-duc353', 'makita-duc355', 'makita-duc357', 'makita-duc400', 'makita-duc405', 'makita-duc406', 'makita-duc407', 'makita-duh501', 'makita-duh502', 'makita-duh506', 'makita-duh507',
  'makita-duh523', 'makita-duh601', 'makita-duh602', 'makita-duh604', 'makita-duh606', 'makita-duh607', 'makita-duh751', 'makita-duh752', 'makita-duh754', 'makita-dum111zx',
  'makita-dun461', 'makita-dun500', 'makita-dun600', 'makita-dup180', 'makita-dup181', 'makita-dup362', 'makita-dur190', 'makita-dur192', 'makita-dur193', 'makita-dur368',
  'makita-dur369', 'makita-dus054', 'makita-dus108', 'makita-dus158', 'makita-duv320', 'makita-dux18', 'makita-dux60', 'makita-lm001', 'makita-lm002g', 'makita-lm002j',
  'makita-lm003', 'makita-lm004g', 'makita-lm004j', 'makita-ua003', 'makita-ua004', 'makita-ub001', 'makita-ub003', 'makita-ub004', 'makita-uc002', 'makita-uc003',
];
assert.equal(makitaExpandedContentBatchIds.length, 560, 'De gecombineerde Makita-regressieset moet 560 basismodellen bevatten.');
assert.equal(new Set(makitaExpandedContentBatchIds).size, 560, 'De gecombineerde Makita-regressieset bevat dubbele basismodellen.');

for (const groupId of makitaExpandedContentBatchIds) {
  const entry = information.entries?.[groupId];
  const registryEntry = registry.entries?.[groupId];
  const auditEntry = canonicalAudit.entries?.[groupId];
  assert.ok(entry, `Makita uitgebreid basismodel ontbreekt: ${groupId}`);
  assert.ok(registryEntry, `Makita uitgebreid basismodel mist bronregistratie: ${groupId}`);
  assert.equal(auditEntry?.status, 'complete', `Makita uitgebreid basismodel is niet compleet in de canonieke audit: ${groupId}`);

  const description = entry.sections?.description;
  const features = entry.sections?.features;
  const technical = entry.sections?.technical;
  assert.ok(String(description?.text || '').trim().length >= 250, `Makita uitgebreide omschrijving is te kort: ${groupId}`);
  assert.ok(Array.isArray(features?.items) && features.items.length >= 4, `Makita uitgebreid basismodel heeft minder dan vier kenmerken: ${groupId}`);
  assert.ok(Array.isArray(technical?.rows) && technical.rows.length >= 5, `Makita uitgebreid basismodel heeft minder dan vijf technische regels: ${groupId}`);

  const labels = technical.rows.map(row => row.label);
  assert.equal(new Set(labels).size, labels.length, `Makita uitgebreid basismodel bevat dubbele technische labels: ${groupId}`);

  for (const [sectionName, section] of Object.entries({ description, features, technical })) {
    assert.equal(section?.source?.status, 'verified', `Makita uitgebreid basismodel bevat een ongeverifieerde sectie: ${groupId}/${sectionName}`);
    assert.equal(section?.source?.sourceType, 'official-manufacturer', `Makita uitgebreid basismodel gebruikt geen fabrikantbron: ${groupId}/${sectionName}`);
    assert.equal(section?.source?.manufacturer, 'Makita Nederland', `Makita uitgebreid basismodel heeft een onjuiste fabrikantbron: ${groupId}/${sectionName}`);
    assert.match(section?.source?.url || '', /^https:\/\/www\.makita\.nl\/(?:artikel\/|product_print\/)/, `Makita uitgebreid basismodel mist een officiële Makita-productpagina of officieel productblad: ${groupId}/${sectionName}`);
    assert.ok(registryEntry.sections?.[sectionName], `Makita uitgebreid basismodel mist ${sectionName} in de bronregistratie: ${groupId}`);
  }
}

const makitaGroups = groups.filter(group => group.brandId === 'makita');
const makitaContentStatus = { complete: 0, partial: 0, missingAllThree: 0, expandedStandardReady: 0 };
for (const group of makitaGroups) {
  const sections = information.entries?.[group.id]?.sections || {};
  const descriptionLength = String(sections.description?.text || '').trim().length;
  const featureCount = Array.isArray(sections.features?.items) ? sections.features.items.length : 0;
  const technicalCount = Array.isArray(sections.technical?.rows) ? sections.technical.rows.length : 0;
  const presentCount = [descriptionLength > 0, featureCount > 0, technicalCount > 0].filter(Boolean).length;
  if (presentCount === 3) makitaContentStatus.complete += 1;
  else if (presentCount > 0) makitaContentStatus.partial += 1;
  else makitaContentStatus.missingAllThree += 1;
  if (descriptionLength >= 250 && featureCount >= 4 && technicalCount >= 5) makitaContentStatus.expandedStandardReady += 1;
}
assert.equal(makitaGroups.length, 854, 'De Makita-auditpopulatie is onverwacht gewijzigd.');
assert.deepEqual(makitaContentStatus, {
  complete: 597,
  partial: 0,
  missingAllThree: 257,
  expandedStandardReady: 597
}, 'De canonieke Makita-status wijkt af van de actuele uitgebreide inhoudsaudit.');
console.log(`✓ Makita-regressiedekking geconsolideerd: ${makitaExpandedContentBatchIds.length} recent uitgebreide modellen bewaakt; 597 compleet, 0 gedeeltelijk en alle 597 op uitgebreide norm.`);
