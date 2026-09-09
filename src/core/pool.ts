/**
 * The whole solar system as one pool of voices.
 *
 * Planets orbit the Sun; moons orbit their planets. Nothing here is flattened onto a shared
 * ring — each body keeps its real parent, its real period and its real semi-major axis, and
 * the renderer draws the hierarchy as it actually is. Pooling them only means the search
 * may CHOOSE from all of them, which moves nothing.
 */
export interface PoolBody {
  id: string
  name: string
  /** Sidereal orbital period in days. */
  periodDays: number
  /** Semi-major axis: AU for planets, km for moons. */
  a: number
  /** Parent body id; undefined for planets, which orbit the Sun. */
  parent?: string
  color: string
  /** Real positions where a browser-side theory exists, else circular mean motion. */
  exact: boolean
  /** Mean longitude at J2000, degrees, for the mean-motion bodies. */
  phase0: number
}

const P = (
  id: string, name: string, periodDays: number, a: number, color: string,
  exact = false, phase0 = 0, parent?: string,
): PoolBody => ({ id, name, periodDays, a, color, exact, phase0, parent })

export const POOL: PoolBody[] = [
  // --- Planets, heliocentric (AU) -----------------------------------------------------
  P('mercury', 'Mercury', 87.9691, 0.387, '#9a9086', true),
  P('venus', 'Venus', 224.701, 0.723, '#e8cf94', true),
  P('earth', 'Earth', 365.2564, 1.000, '#4a86c8', true),
  P('mars', 'Mars', 686.980, 1.524, '#c1502e', true),
  P('jupiter', 'Jupiter', 4332.589, 5.203, '#d8b48a', true),
  P('saturn', 'Saturn', 10759.22, 9.537, '#e3cd9a', true),
  P('uranus', 'Uranus', 30688.5, 19.19, '#9fdce4', true),
  P('neptune', 'Neptune', 60195.0, 30.07, '#5a7fe0', true),
  P('pluto', 'Pluto', 90560.0, 39.48, '#c2ab94', true),

  // --- Moons (km from their planet) ---------------------------------------------------
  P('luna', 'the Moon', 27.321661, 384400, '#cfcbc4', true, 0, 'earth'),

  P('phobos', 'Phobos', 0.3189100, 9376, '#8a7263', false, 120, 'mars'),
  P('deimos', 'Deimos', 1.2624410, 23463, '#9c8674', false, 60, 'mars'),

  P('metis', 'Metis', 0.2947800, 128000, '#8d8378', false, 10, 'jupiter'),
  P('adrastea', 'Adrastea', 0.2982600, 129000, '#9a9086', false, 190, 'jupiter'),
  P('amalthea', 'Amalthea', 0.4981790, 181366, '#b0705a', false, 95, 'jupiter'),
  P('thebe', 'Thebe', 0.6745360, 221889, '#96786a', false, 260, 'jupiter'),
  P('io', 'Io', 1.769137786, 421700, '#f2d64e', true, 0, 'jupiter'),
  P('europa', 'Europa', 3.551181041, 671034, '#efe6d2', true, 0, 'jupiter'),
  P('ganymede', 'Ganymede', 7.154552960, 1070412, '#a89a86', true, 0, 'jupiter'),
  P('callisto', 'Callisto', 16.689018400, 1882709, '#7d7266', true, 0, 'jupiter'),
  P('himalia', 'Himalia', 250.5662, 11461000, '#8b8074', false, 210, 'jupiter'),

  P('pan', 'Pan', 0.5750500, 133584, '#c9c2b2', false, 15, 'saturn'),
  P('prometheus', 'Prometheus', 0.6129850, 139380, '#bdb6a6', false, 200, 'saturn'),
  P('pandora', 'Pandora', 0.6285040, 141720, '#c4bcac', false, 310, 'saturn'),
  P('epimetheus', 'Epimetheus', 0.6943330, 151410, '#b2aa9a', false, 45, 'saturn'),
  P('janus', 'Janus', 0.6945900, 151460, '#bab2a2', false, 225, 'saturn'),
  P('mimas', 'Mimas', 0.9424218, 185539, '#cfc9bd', false, 0, 'saturn'),
  P('enceladus', 'Enceladus', 1.3702180, 237948, '#f2f4f5', false, 70, 'saturn'),
  P('tethys', 'Tethys', 1.8878020, 294619, '#dcd6c8', false, 145, 'saturn'),
  P('dione', 'Dione', 2.7369150, 377396, '#c8c2b4', false, 220, 'saturn'),
  P('rhea', 'Rhea', 4.5182120, 527108, '#b6ada0', false, 300, 'saturn'),
  P('titan', 'Titan', 15.9454170, 1221870, '#e0a45c', false, 30, 'saturn'),
  P('hyperion', 'Hyperion', 21.2766090, 1481009, '#a8977f', false, 160, 'saturn'),
  P('iapetus', 'Iapetus', 79.3215000, 3560820, '#96897a', false, 250, 'saturn'),
  P('phoebe', 'Phoebe', 550.3100000, 12947780, '#6f6659', false, 100, 'saturn'),

  P('miranda', 'Miranda', 1.4134790, 129390, '#a9b6bd', false, 340, 'uranus'),
  P('ariel', 'Ariel', 2.5203790, 190900, '#bfc9cd', false, 20, 'uranus'),
  P('umbriel', 'Umbriel', 4.1441770, 266000, '#8e979b', false, 155, 'uranus'),
  P('titania', 'Titania', 8.7058720, 436300, '#b3bcc0', false, 240, 'uranus'),
  P('oberon', 'Oberon', 13.4632390, 583500, '#9ba4a8', false, 35, 'uranus'),

  P('proteus', 'Proteus', 1.1223150, 117647, '#8f9199', false, 280, 'neptune'),
  P('triton', 'Triton', 5.8768540, 354759, '#d5dde2', false, 100, 'neptune'),
  P('nereid', 'Nereid', 360.1362, 5513400, '#9aa0a6', false, 330, 'neptune'),

  P('charon', 'Charon', 6.3872300, 19591, '#b8ab9c', false, 45, 'pluto'),

  // --- Jupiter's outer and irregular moons (JPL SSD sidereal periods, days) -----------
  P('themisto','Themisto',130.02,7284000,'#7d7468',false,15,'jupiter'),
  P('leda','Leda',240.92,11165000,'#867c70',false,140,'jupiter'),
  P('lysithea','Lysithea',259.20,11717000,'#807668',false,300,'jupiter'),
  P('elara','Elara',259.64,11741000,'#8b8175',false,75,'jupiter'),
  P('carpo','Carpo',456.10,17058000,'#736a5f',false,230,'jupiter'),
  P('euporie','Euporie',550.74,19302000,'#6e6559',false,55,'jupiter'),
  P('ananke','Ananke',610.45,21276000,'#7a7165',false,190,'jupiter'),
  P('euanthe','Euanthe',620.49,20797000,'#726a5e',false,20,'jupiter'),
  P('harpalyke','Harpalyke',623.32,20858000,'#7c7367',false,265,'jupiter'),
  P('praxidike','Praxidike',625.30,20907000,'#6a6155',false,110,'jupiter'),
  P('iocaste','Iocaste',631.50,21061000,'#756c60',false,325,'jupiter'),
  P('thyone','Thyone',627.30,20940000,'#807769',false,85,'jupiter'),
  P('hermippe','Hermippe',633.90,21131000,'#6f665a',false,205,'jupiter'),
  P('carme','Carme',702.28,23404000,'#7a7064',false,45,'jupiter'),
  P('pasiphae','Pasiphae',708.02,23624000,'#847a6e',false,160,'jupiter'),
  P('eurydome','Eurydome',717.33,22865000,'#6c6357',false,280,'jupiter'),
  P('pasithee','Pasithee',719.50,23096000,'#786f63',false,95,'jupiter'),
  P('chaldene','Chaldene',723.80,23179000,'#736a5e',false,215,'jupiter'),
  P('sinope','Sinope',724.50,23939000,'#7f7569',false,10,'jupiter'),
  P('isonoe','Isonoe',726.20,23217000,'#6d6458',false,130,'jupiter'),
  P('erinome','Erinome',728.30,23279000,'#7a7165',false,250,'jupiter'),
  P('kale','Kale',729.50,23217000,'#716858',false,35,'jupiter'),
  P('aitne','Aitne',730.20,23231000,'#7c7266',false,175,'jupiter'),
  P('taygete','Taygete',732.20,23360000,'#696054',false,290,'jupiter'),
  P('cyllene','Cyllene',737.80,23396000,'#786f63',false,60,'jupiter'),
  P('kalyke','Kalyke',743.00,23483000,'#746b5f',false,185,'jupiter'),
  P('megaclite','Megaclite',752.80,23806000,'#807769',false,310,'jupiter'),
  P('callirrhoe','Callirrhoe',758.77,24103000,'#6b6256',false,120,'jupiter'),
  P('autonoe','Autonoe',761.00,24046000,'#7d7367',false,240,'jupiter'),
  P('aoede','Aoede',761.50,23981000,'#726957',false,5,'jupiter'),
  P('sponde','Sponde',771.60,23487000,'#797064',false,155,'jupiter'),
  P('kore','Kore',779.20,24543000,'#6f665a',false,270,'jupiter'),

  // --- Saturn's small and irregular moons ---------------------------------------------
  P('daphnis','Daphnis',0.594080,136505,'#cfc7b6',false,80,'saturn'),
  P('atlas','Atlas',0.601790,137670,'#c9c1b0',false,195,'saturn'),
  P('aegaeon','Aegaeon',0.808120,167500,'#c2baa9',false,25,'saturn'),
  P('methone','Methone',1.009570,194440,'#d4ccbb',false,140,'saturn'),
  P('anthe','Anthe',1.036500,197700,'#cbc3b2',false,255,'saturn'),
  P('pallene','Pallene',1.153750,212280,'#d8d0bf',false,10,'saturn'),
  P('telesto','Telesto',1.887802,294619,'#ddd5c4',false,265,'saturn'),
  P('calypso','Calypso',1.887802,294619,'#d6cebd',false,25,'saturn'),
  P('helene','Helene',2.736915,377396,'#cfc7b6',false,340,'saturn'),
  P('polydeuces','Polydeuces',2.736915,377396,'#c7bfae',false,100,'saturn'),
  P('kiviuq','Kiviuq',449.22,11294800,'#6f665a',false,60,'saturn'),
  P('ijiraq','Ijiraq',451.42,11355300,'#786f63',false,175,'saturn'),
  P('paaliaq','Paaliaq',686.92,15103400,'#726957',false,290,'saturn'),
  P('skathi','Skathi',728.20,15641000,'#6b6256',false,45,'saturn'),
  P('albiorix','Albiorix',783.45,16266700,'#7d7367',false,160,'saturn'),
  P('bebhionn','Bebhionn',834.84,17119000,'#6e6559',false,275,'saturn'),
  P('erriapus','Erriapus',871.19,17604000,'#79705f',false,30,'saturn'),
  P('siarnaq','Siarnaq',895.53,17776600,'#746b5f',false,145,'saturn'),
  P('tarvos','Tarvos',926.23,18239000,'#807769',false,260,'saturn'),
  P('mundilfari','Mundilfari',952.63,18709000,'#6a6155',false,15,'saturn'),
  P('narvi','Narvi',1003.86,19349000,'#7b7266',false,130,'saturn'),
  P('suttungr','Suttungr',1016.67,19459000,'#6f665a',false,245,'saturn'),
  P('thrymr','Thrymr',1094.11,20314000,'#767d61',false,0,'saturn'),
  P('ymir','Ymir',1315.14,23040000,'#726957',false,115,'saturn'),

  // --- Uranus's inner and irregular moons ----------------------------------------------
  P('cordelia','Cordelia',0.335034,49770,'#9aa3a7',false,50,'uranus'),
  P('ophelia','Ophelia',0.376400,53790,'#a2abaf',false,165,'uranus'),
  P('bianca','Bianca',0.434579,59170,'#949da1',false,280,'uranus'),
  P('cressida','Cressida',0.463570,61780,'#9ca5a9',false,35,'uranus'),
  P('desdemona','Desdemona',0.473650,62680,'#8f989c',false,150,'uranus'),
  P('juliet','Juliet',0.493065,64350,'#a7b0b4',false,265,'uranus'),
  P('portia','Portia',0.513196,66090,'#98a1a5',false,20,'uranus'),
  P('rosalind','Rosalind',0.558460,69940,'#a0a9ad',false,135,'uranus'),
  P('cupid','Cupid',0.613,74800,'#8b9498',false,250,'uranus'),
  P('belinda','Belinda',0.623527,75260,'#9aa3a7',false,5,'uranus'),
  P('perdita','Perdita',0.638,76400,'#93a0a4',false,120,'uranus'),
  P('puck','Puck',0.761833,86010,'#a4adb1',false,235,'uranus'),
  P('mab','Mab',0.923,97700,'#8e979b',false,350,'uranus'),
  P('francisco','Francisco',267.09,4276000,'#6f7679',false,105,'uranus'),
  P('caliban','Caliban',579.73,7231000,'#787f82',false,220,'uranus'),
  P('stephano','Stephano',677.37,8004000,'#6a7174',false,335,'uranus'),
  P('trinculo','Trinculo',749.24,8504000,'#737a7d',false,90,'uranus'),
  P('sycorax','Sycorax',1288.30,12179000,'#7c8386',false,205,'uranus'),
  P('margaret','Margaret',1687.01,14345000,'#666d70',false,320,'uranus'),
  P('prospero','Prospero',1978.29,16256000,'#757c7f',false,75,'uranus'),
  P('setebos','Setebos',2225.21,17418000,'#6e7578',false,190,'uranus'),

  // --- Neptune's inner and irregular moons ---------------------------------------------
  P('naiad','Naiad',0.294396,48227,'#8f9199',false,40,'neptune'),
  P('thalassa','Thalassa',0.311485,50075,'#979aa2',false,155,'neptune'),
  P('despina','Despina',0.334655,52526,'#8a8d95',false,270,'neptune'),
  P('galatea','Galatea',0.428745,61953,'#92959d',false,25,'neptune'),
  P('larissa','Larissa',0.554654,73548,'#8d9098',false,140,'neptune'),
  P('hippocamp','Hippocamp',0.9500,105300,'#85888f',false,255,'neptune'),
  P('halimede','Halimede',1879.71,16611000,'#6f7276',false,10,'neptune'),
  P('sao','Sao',2914.07,22228000,'#787b80',false,125,'neptune'),
  P('laomedeia','Laomedeia',3167.85,23567000,'#71747a',false,240,'neptune'),

  // --- Pluto's small moons --------------------------------------------------------------
  P('styx','Styx',20.16155,42656,'#b0a698',false,70,'pluto'),
  P('nix','Nix',24.85463,48694,'#bab0a2',false,185,'pluto'),
  P('kerberos','Kerberos',32.16756,57783,'#a89e90',false,300,'pluto'),
  P('hydra','Hydra',38.20177,64738,'#c2b8aa',false,55,'pluto'),
]

export const poolById = new Map(POOL.map((b) => [b.id, b]))
