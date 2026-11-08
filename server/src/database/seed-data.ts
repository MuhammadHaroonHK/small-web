export const seedPeople = [
  {
    id: '650000000000000000000001',
    name: 'Avery Chen',
  },
  {
    id: '650000000000000000000002',
    name: 'Samira Patel',
  },
  {
    id: '650000000000000000000003',
    name: 'Jordan Brooks',
  },
] as const;

export const seedSites = [
  {
    id: '660000000000000000000001',
    address: 'smallweb://field-notes',
    title: 'Field Notes from the Neighborhood',
    authorId: seedPeople[0].id,
    textContent:
      'A field journal for noticing the small details of city life, from sidewalk gardens to the people who care for them. This week we are following the volunteers who have turned neglected corners into shared green spaces.',
    html: `<h1>Field Notes from the Neighborhood</h1>
<p>A field journal for noticing the small details of city life, from sidewalk gardens to the people who care for them. This week we are following the volunteers who have turned neglected corners into shared green spaces.</p>
<h2>Start with one block</h2>
<p>Neighborhood change rarely begins with a grand plan. It begins when someone brings a broom, a few seeds, and enough patience to learn what the soil can support.</p>
<p>Read about the <a href="smallweb://corner-garden">corner garden project</a>, then meet the people behind it in our <a href="smallweb://gardeners">gardener interviews</a>.</p>`,
  },
  {
    id: '660000000000000000000002',
    address: 'smallweb://corner-garden',
    title: 'A Garden at the Corner',
    authorId: seedPeople[0].id,
    textContent:
      'The garden at Pine and Third began with three wooden boxes and a borrowed watering can. Neighbors now grow herbs, beans, and flowers together, sharing the work and the harvest.',
    html: `<h1>A Garden at the Corner</h1>
<p>The garden at Pine and Third began with three wooden boxes and a borrowed watering can. Neighbors now grow herbs, beans, and flowers together, sharing the work and the harvest.</p>
<h2>What grows here</h2>
<p>Mint and chives thrive near the path, while climbing beans make use of the sunny fence. The group keeps a paper calendar so watering and weeding never fall to one person alone.</p>
<p>For practical advice, visit <a href="smallweb://seed-library">the neighborhood seed library</a> or read <a href="smallweb://water-wise">how the garden saves water</a>.</p>`,
  },
  {
    id: '660000000000000000000003',
    address: 'smallweb://seed-library',
    title: 'The Neighborhood Seed Library',
    authorId: seedPeople[0].id,
    textContent:
      'A seed library lets residents borrow packets in spring and return saved seeds in autumn. The collection favors hardy local varieties, clear growing notes, and generous sharing.',
    html: `<h1>The Neighborhood Seed Library</h1>
<p>A seed library lets residents borrow packets in spring and return saved seeds in autumn. The collection favors hardy local varieties, clear growing notes, and generous sharing.</p>
<h2>Borrow, grow, share</h2>
<p>Each packet includes a planting window and a short description of the plant. New gardeners can start with easy greens before trying beans, tomatoes, or flowers that attract pollinators.</p>
<p>See what is growing at <a href="smallweb://corner-garden">the corner garden</a> and learn about <a href="smallweb://compost-club">the community compost club</a>.</p>`,
  },
  {
    id: '660000000000000000000004',
    address: 'smallweb://gardeners',
    title: 'The People Who Keep the Garden Growing',
    authorId: seedPeople[0].id,
    textContent:
      'Gardeners describe the project as a place to learn each other’s names as much as a place to grow food. Their interviews reveal how shared routines make a block feel more welcoming.',
    html: `<h1>The People Who Keep the Garden Growing</h1>
<p>Gardeners describe the project as a place to learn each other’s names as much as a place to grow food. Their interviews reveal how shared routines make a block feel more welcoming.</p>
<h2>Small acts, shared ownership</h2>
<p>One neighbor brings seedlings; another repairs the gate. Children label the herbs, and people passing by often stop to ask what is ready to pick.</p>
<p>Read the original <a href="smallweb://field-notes">field notes</a> or find the next <a href="smallweb://repair-cafe">community repair café</a>.</p>`,
  },
  {
    id: '660000000000000000000005',
    address: 'smallweb://water-wise',
    title: 'A Water-Wise City Garden',
    authorId: seedPeople[0].id,
    textContent:
      'A healthy city garden can use less water by building soil, choosing resilient plants, and watering slowly at the roots. Mulch and shared rain barrels help make every litre count.',
    html: `<h1>A Water-Wise City Garden</h1>
<p>A healthy city garden can use less water by building soil, choosing resilient plants, and watering slowly at the roots. Mulch and shared rain barrels help make every litre count.</p>
<h2>Keep moisture in the soil</h2>
<p>A layer of leaves or straw shades the ground, while compost improves its ability to hold moisture. Watering early in the day gives plants time to take it up before the afternoon heat.</p>
<p>Our <a href="smallweb://corner-garden">corner garden</a> keeps a weekly watering rota. You can also learn how neighbors turn scraps into soil at the <a href="smallweb://compost-club">compost club</a>.</p>`,
  },
  {
    id: '660000000000000000000006',
    address: 'smallweb://compost-club',
    title: 'The Community Compost Club',
    authorId: seedPeople[1].id,
    textContent:
      'The compost club collects fruit and vegetable scraps from nearby households and returns finished compost to gardens. A simple rotation of bins keeps the process clean, useful, and easy to learn.',
    html: `<h1>The Community Compost Club</h1>
<p>The compost club collects fruit and vegetable scraps from nearby households and returns finished compost to gardens. A simple rotation of bins keeps the process clean, useful, and easy to learn.</p>
<h2>From scraps to healthy soil</h2>
<p>Members balance fresh kitchen scraps with dry leaves and shredded paper. Turning the active bin every week adds air and helps the material break down evenly.</p>
<p>Bring finished compost to <a href="smallweb://corner-garden">the corner garden</a>, or browse the <a href="smallweb://seed-library">seed library</a> for a new planting project.</p>`,
  },
  {
    id: '660000000000000000000007',
    address: 'smallweb://repair-cafe',
    title: 'Saturday at the Repair Café',
    authorId: seedPeople[1].id,
    textContent:
      'At the repair café, volunteer fixers help residents mend lamps, clothing, and small household objects. The goal is to share skills, extend the life of useful things, and enjoy a cup of tea together.',
    html: `<h1>Saturday at the Repair Café</h1>
<p>At the repair café, volunteer fixers help residents mend lamps, clothing, and small household objects. The goal is to share skills, extend the life of useful things, and enjoy a cup of tea together.</p>
<h2>Bring a curious mind</h2>
<p>Visitors work alongside a volunteer rather than leaving items behind. Even when a repair is not possible, people leave knowing more about how an object was made and what might be tried next.</p>
<p>See the latest <a href="smallweb://tool-library">tool library notes</a>, the <a href="smallweb://gardeners">garden volunteer interviews</a>, and the unpublished <a href="smallweb://missing-sewing-room">sewing room plan</a>.</p>`,
  },
  {
    id: '660000000000000000000008',
    address: 'smallweb://tool-library',
    title: 'Borrow More, Buy Less: The Tool Library',
    authorId: seedPeople[1].id,
    textContent:
      'The tool library lends drills, ladders, sewing machines, and garden tools to local residents. A shared inventory makes occasional projects affordable and gives useful equipment a longer life.',
    html: `<h1>Borrow More, Buy Less: The Tool Library</h1>
<p>The tool library lends drills, ladders, sewing machines, and garden tools to local residents. A shared inventory makes occasional projects affordable and gives useful equipment a longer life.</p>
<h2>Tools are better together</h2>
<p>Every loan includes a quick safety check and a clear return date. Volunteers keep maintenance notes so the next neighbor can borrow equipment with confidence.</p>
<p>Some tools are used at the <a href="smallweb://repair-cafe">repair café</a>; others help build the beds at <a href="smallweb://corner-garden">the corner garden</a>.</p>`,
  },
  {
    id: '660000000000000000000009',
    address: 'smallweb://walking-map',
    title: 'A Slow Walk Along the Canal',
    authorId: seedPeople[2].id,
    textContent:
      'This walking map follows a quiet canal path past old brick bridges, pocket parks, and a small public noticeboard. It is an invitation to explore familiar streets at an unhurried pace.',
    html: `<h1>A Slow Walk Along the Canal</h1>
<p>This walking map follows a quiet canal path past old brick bridges, pocket parks, and a small public noticeboard. It is an invitation to explore familiar streets at an unhurried pace.</p>
<h2>Notice what changes</h2>
<p>Start at the stone bridge and follow the water east. In the morning, market carts arrive near the old mill; by evening, the path belongs to cyclists and people walking home.</p>
<p>Take a short detour to the <a href="smallweb://community-kitchen">community kitchen</a>, or follow this <a href="smallweb://missing-canal-archive">unfinished canal archive</a> link, which has not been published yet.</p>`,
  },
  {
    id: '66000000000000000000000a',
    address: 'smallweb://community-kitchen',
    title: 'The Community Kitchen Table',
    authorId: seedPeople[2].id,
    textContent:
      'The community kitchen hosts shared meals where residents cook seasonal food and exchange recipes. The table is open to newcomers, and each gathering is organized around a simple dish anyone can help prepare.',
    html: `<h1>The Community Kitchen Table</h1>
<p>The community kitchen hosts shared meals where residents cook seasonal food and exchange recipes. The table is open to newcomers, and each gathering is organized around a simple dish anyone can help prepare.</p>
<h2>Food brings stories with it</h2>
<p>Guests bring a vegetable, a recipe, or simply an appetite. The kitchen works with produce from local growers and makes room for different traditions without requiring anyone to be an expert cook.</p>
<p>Walk here from the <a href="smallweb://walking-map">canal path</a>, and read about the <a href="smallweb://corner-garden">garden that supplies fresh herbs</a>.</p>`,
  },
] as const;

export const seedVisits = [
  { personId: seedPeople[0].id, address: 'smallweb://field-notes', title: 'Field Notes from the Neighborhood', time: '2025-05-17T09:00:00.000Z', source: 'typed' },
  { personId: seedPeople[0].id, address: 'smallweb://corner-garden', title: 'A Garden at the Corner', time: '2025-05-17T09:04:00.000Z', source: 'link' },
  { personId: seedPeople[0].id, address: 'smallweb://seed-library', title: 'The Neighborhood Seed Library', time: '2025-05-17T09:08:00.000Z', source: 'link' },
  { personId: seedPeople[0].id, address: 'smallweb://compost-club', title: 'The Community Compost Club', time: '2025-05-17T09:12:00.000Z', source: 'link' },
  { personId: seedPeople[0].id, address: 'smallweb://corner-garden', title: 'A Garden at the Corner', time: '2025-05-17T09:16:00.000Z', source: 'back' },
  { personId: seedPeople[0].id, address: 'smallweb://water-wise', title: 'A Water-Wise City Garden', time: '2025-05-17T09:20:00.000Z', source: 'link' },
  { personId: seedPeople[0].id, address: 'smallweb://gardeners', title: 'The People Who Keep the Garden Growing', time: '2025-05-17T09:24:00.000Z', source: 'link' },
  { personId: seedPeople[0].id, address: 'smallweb://field-notes', title: 'Field Notes from the Neighborhood', time: '2025-05-17T09:28:00.000Z', source: 'history' },
  { personId: seedPeople[0].id, address: 'smallweb://corner-garden', title: 'A Garden at the Corner', time: '2025-05-17T09:32:00.000Z', source: 'link' },
  { personId: seedPeople[0].id, address: 'smallweb://missing-seed-swap', title: 'Unavailable page', time: '2025-05-17T09:36:00.000Z', source: 'link' },
  { personId: seedPeople[1].id, address: 'smallweb://repair-cafe', title: 'Saturday at the Repair Café', time: '2025-05-17T09:10:00.000Z', source: 'typed' },
  { personId: seedPeople[1].id, address: 'smallweb://tool-library', title: 'Borrow More, Buy Less: The Tool Library', time: '2025-05-17T09:17:00.000Z', source: 'link' },
  { personId: seedPeople[1].id, address: 'smallweb://compost-club', title: 'The Community Compost Club', time: '2025-05-17T09:24:00.000Z', source: 'search' },
  { personId: seedPeople[1].id, address: 'smallweb://corner-garden', title: 'A Garden at the Corner', time: '2025-05-17T09:31:00.000Z', source: 'link' },
  { personId: seedPeople[1].id, address: 'smallweb://repair-cafe', title: 'Saturday at the Repair Café', time: '2025-05-17T09:38:00.000Z', source: 'history' },
  { personId: seedPeople[1].id, address: 'smallweb://tool-library', title: 'Borrow More, Buy Less: The Tool Library', time: '2025-05-17T09:45:00.000Z', source: 'link' },
  { personId: seedPeople[1].id, address: 'smallweb://missing-sewing-room', title: 'Unavailable page', time: '2025-05-17T09:52:00.000Z', source: 'typed' },
  { personId: seedPeople[2].id, address: 'smallweb://walking-map', title: 'A Slow Walk Along the Canal', time: '2025-05-17T09:05:00.000Z', source: 'typed' },
  { personId: seedPeople[2].id, address: 'smallweb://community-kitchen', title: 'The Community Kitchen Table', time: '2025-05-17T09:14:00.000Z', source: 'link' },
  { personId: seedPeople[2].id, address: 'smallweb://missing-canal-archive', title: 'Unavailable page', time: '2025-05-17T09:23:00.000Z', source: 'link' },
] as const;
