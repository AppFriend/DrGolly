import { storage } from "./storage";
import { readFileSync } from "fs";
import { join } from "path";

// Parse CSV data from the attached file
const csvData = `"Category module","Content Category2","Content Type course","Course Default Price","Course Description","Course Discounted Price","Course Name","Course Schedule module","Description module","Digital Course Link","Duration of Course","Image","modules","Post Content","post course","Set timefarme module","skill 1","stripe product id","user","Video","Watched Course","Creation Date","Modified Date","Slug","Creator","unique id"
"Baby Sleep","Baby Sleep","Paid course","120","4-16 Weeks","","Little Baby Sleep Program","","","","","//25c623a83912a41d23bcc5865ecf275d.cdn.bubble.io/f1741818599936x610887471554524000/1.png","1738834734656x736352551815348200 , 1739316760573x667361320420507600 , 1739317234615x266310870609428500 , 1739317797799x557408784396582900 , 1739318064419x752283509753380900 , 1739318443886x572804671354175500 , 1739318814239x997237020893642800 , 1739320347136x238621245535944700 , 1739320948609x511350386740690940 , 1739321834923x177880906997170180 , 1739321971840x364642261110620160 , 1739322562458x566140045373472800 , 1739324047032x816644081946198000 , 1739324452238x600096401657954300 , 1739325099254x574552446427725800 , 1739325657883x526248955970846700 , 1739325916806x341196481198817300 , 1739325978307x403412749469089800 , 1739326419416x253744240395288580 , 1739326680668x304928164792762400 , 1739326791906x974500758898606100 , 1739327112796x260415279978512400","","","","Beginner","prod_SDtZKUzta8TGqW","","","","Jan 30, 2025 3:29 pm","Jun 10, 2025 9:08 pm","","(deleted thing)","1738211381074x619811994544111600"
"Baby Sleep","Baby Sleep","Paid course","120","4-8 Months","","Big Baby Sleep Program","","","","","//25c623a83912a41d23bcc5865ecf275d.cdn.bubble.io/f1741818614506x569606633915210600/2.png","1738572427580x779667483241742300 , 1739404266739x737943141551439900 , 1739404874277x566403385926352900 , 1739405595881x808617604539482100 , 1739412183785x656457312169885700 , 1739412328631x579161976752832500 , 1739413426983x543950786234941440 , 1739413531167x196995678802804740 , 1739413819601x532151439896346600 , 1739414166539x119571833544245250 , 1739414387848x895418175448940500 , 1739418315250x406305061055234050 , 1739419635160x407402306033680400 , 1739419997758x274450068408893440 , 1739420358376x221481147581595650 , 1739420501009x365658769056071700 , 1739430687631x862781959823949800 , 1739431325162x199084684401704960","","","","Beginner","prod_SDtatrd4ZFLBBL","","","","Jan 30, 2025 3:30 pm","Jun 10, 2025 9:09 pm","","(deleted thing)","1738211436896x174196059034091520"
"Toddler Sleep","Toddler Sleep","Paid course","120","8-12 Months","","Pre-Toddler Sleep Program","","","","","//25c623a83912a41d23bcc5865ecf275d.cdn.bubble.io/f1741818724099x695433412409793840/App%20Images%201200x600%20%284%29.png","1739590384607x621918906970275800 , 1739834647774x719256896214138900 , 1739834880856x830132068100341800 , 1739836249772x506396585856860160 , 1739836385755x733166840193744900 , 1739837425055x555718533433786400 , 1739837475489x515317807894233100 , 1739837703247x674864623323185200 , 1739838489586x199259166455889900 , 1739838633428x760176269907722200 , 1739839171453x540942806626861060 , 1739839232818x602856156324692000 , 1739839344086x387281283648061400 , 1739839597621x992373068144312300 , 1739839632809x446445774543781900 , 1739840359425x575851218170806300","","","","Beginner","","","","","Jan 30, 2025 3:31 pm","Jun 10, 2025 8:59 am","","(deleted thing)","1738211513350x866090906720665600"
"Toddler Sleep","Toddler Sleep","Paid course","120","1-2 Years","","Toddler Sleep Program","","","","","//25c623a83912a41d23bcc5865ecf275d.cdn.bubble.io/f1741818749553x993331556486152200/3.png","1739842878141x673622107033698300 , 1739843833309x720000265638903800 , 1739844612555x686972828783738900 , 1739845108414x370506733372833800 , 1739845183060x560175388420997100 , 1739845293916x794889354558046200 , 1739845698160x480686079411486700 , 1739845742319x498639056372498400 , 1739852678621x878721843430948900 , 1739852911596x486239068758212600 , 1739853000990x371404780299616260 , 1739853542333x351591613352116200","","","","Beginner","","","","","Jan 30, 2025 3:32 pm","Jun 10, 2025 9:00 am","","(deleted thing)","1738211565701x843388859190345700"
"Toddler Sleep","Toddler Sleep","Paid course","120","2-5 Years","","Pre-School Sleep Program","","","","","//25c623a83912a41d23bcc5865ecf275d.cdn.bubble.io/f1741818759367x965443183735891500/4.png","1739853881388x457106609327308800 , 1739854192545x504534235206385660 , 1739854915536x141411254491414530 , 1739855032626x569786725908611100 , 1739855843346x207853432775639040 , 1740102056647x644301044728725500 , 1740102825055x530856698201505800 , 1740102910381x687193259077533700 , 1740103047665x442507803526955000 , 1740103114279x745271274324148200 , 1740103708294x770717054237933600","","","","Beginner","","","","","Jan 30, 2025 3:33 pm","Jun 10, 2025 9:00 am","","(deleted thing)","1738211625998x856545795660054500"
"Baby Sleep","","Paid course","120","","","Preparation for Newborns","","","","","//25c623a83912a41d23bcc5865ecf275d.cdn.bubble.io/f1741818779219x350982927225671940/App%20Images%201200x600%20%283%29.png","1738632025515x548366653142073340 , 1738633084738x312993908115374100 , 1738633347232x107546768616194050 , 1738633411880x357226257233739800 , 1738633552046x828163373022576600 , 1738634106067x341173929951887360 , 1738634366548x961658373641338900 , 1738634508572x512768174785560600 , 1738634931258x646928319327502300 , 1738635671816x357286792565096450 , 1738636007703x286417664784728060 , 1738640781024x151658190525956100 , 1738641590047x796458136505417700 , 1738641802979x308228964226170900 , 1738642780987x292531974571819000 , 1738643135557x580912365815464000 , 1738643219926x805218160844996600 , 1738643266475x556707383667589100 , 1738643928657x752451162313588700 , 1738643984912x899563491245686800 , 1738644370458x192256391849443330 , 1738644436585x540817552232153100 , 1738644897032x611135441886249000 , 1738644965661x704926014830542800 , 1740628732071x327482421046935550","","","","Intermediate","","","","","Feb 4, 2025 12:18 pm","Jul 4, 2025 9:43 am","","(deleted thing)","1738631920240x970515425764835300"
"Toddler Sleep","","Paid course","25","New Sibling Supplement","","New Sibling Supplement","","","","","//25c623a83912a41d23bcc5865ecf275d.cdn.bubble.io/f1741818827998x159916092063113300/6.png","1740714049256x385830357637529600 , 1740714123620x455593819487600640 , 1740714222432x713240023700340700 , 1740714405126x171202909751738370 , 1740714575533x948535436421890000 , 1740714756363x240005559217815550 , 1740715006344x489688614410387460 , 1740715127533x710409772480069600","","","","Beginner","","","","","Feb 28, 2025 2:40 pm","Jul 5, 2025 10:32 am","","alex@drgolly.com","1740714032807x880560269585023000"
"Baby Sleep","","Paid course","25","Twins Supplement","","Twins Supplement","","","","","//25c623a83912a41d23bcc5865ecf275d.cdn.bubble.io/f1741818839324x814539166578639500/5.png","1740715490789x101398945642053630 , 1740715618492x750202656341360600 , 1740716100264x216492533534162940 , 1740716291800x348773092676599800 , 1740716345753x514416670969692200 , 1740716470325x780324545873051600 , 1740716537119x266748458060218370 , 1740716790959x269003902353670140 , 1740716858723x128778438596624380","","","","Beginner","","","","","Feb 28, 2025 3:03 pm","Apr 30, 2025 1:50 pm","","alex@drgolly.com","1740715399162x980182825696755700"
"Toddler Behavior*","","Paid course","120","Toddler Toolkit ","","Toddler Toolkit","","","","","//25c623a83912a41d23bcc5865ecf275d.cdn.bubble.io/f1742356561647x249813150318177100/App%20Header-Toddler%20Toolkit.png","1741822468219x161471023671410700 , 1741822768859x557685638417088500 , 1741828884035x286537950721736700 , 1741829493723x992100870422265900 , 1741832166684x267595776224657400 , 1741833005798x469828407735091200 , 1741836317283x161632054876569600 , 1741836897554x685761904016621600 , 1741861739212x236052652416827400 , 1741862176675x312778512831610900 , 1741862793126x743461027999907800 , 1741863660523x801214240580436000 , 1741864385195x340897733218140160 , 1741864554511x220414814163828740 , 1741864937309x781165193091350500 , 1741913131259x543050382522449900 , 1741913666215x987111346338791400 , 1741923795883x356127335608483840","","","","Beginner","","","","","Mar 13, 2025 10:34 am","Jun 10, 2025 9:00 am","","alex@drgolly.com","1741822441185x826889298740510700"
"Nutrition","","Paid course","0","Introduce Allergens with Confidence","","Testing Allergens","","","","","//25c623a83912a41d23bcc5865ecf275d.cdn.bubble.io/f1746521034584x548445119604826400/App%20Images%201200x600%20%282%29.png","1746569388212x962871166558011400 , 1746569470415x743535457338130400 , 1746569593673x217884409329352700","","","","Beginner","","","","","May 6, 2025 6:44 pm","May 7, 2025 8:14 am","","alannah@drgolly.com","1746521064418x896614461038395400"`;

function parseCsvLine(line: string): string[] {
  const result = [];
  let current = '';
  let inQuotes = false;
  let i = 0;
  
  while (i < line.length) {
    const char = line[i];
    
    if (char === '"' && !inQuotes) {
      inQuotes = true;
    } else if (char === '"' && inQuotes) {
      if (i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++; // Skip the next quote
      } else {
        inQuotes = false;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
    i++;
  }
  
  result.push(current.trim());
  return result;
}

function parseCsv(csvText: string): string[][] {
  const lines = csvText.split('\n').filter(line => line.trim());
  return lines.map(parseCsvLine);
}

function getCategory(category: string): string {
  if (category.includes('Baby Sleep')) return 'sleep';
  if (category.includes('Toddler Sleep')) return 'sleep';
  if (category.includes('Toddler Behavior')) return 'health';
  if (category.includes('Nutrition')) return 'nutrition';
  return 'freebies';
}

function getTier(price: string): string {
  const priceNum = parseInt(price) || 0;
  if (priceNum === 0) return 'free';
  if (priceNum <= 25) return 'gold';
  return 'platinum';
}

function parseModulesIds(moduleString: string): string[] {
  return moduleString.split(',').map(id => id.trim()).filter(id => id.length > 0);
}

export async function seedCourses() {
  console.log('Starting course seeding...');
  
  const rows = parseCsv(csvData);
  const [headers, ...dataRows] = rows;
  
  // Clear existing courses first
  console.log('Clearing existing courses...');
  
  for (const row of dataRows) {
    if (row.length < headers.length) continue;
    
    const data: Record<string, string> = {};
    headers.forEach((header, index) => {
      data[header] = row[index] || '';
    });
    
    // Skip if no course name
    if (!data['Course Name']) continue;

    const course = {
      title: data['Course Name'],
      description: data['Course Description'] || data['Course Name'],
      category: getCategory(data['Category module']),
      ageRange: data['Course Description'] || '',
      tier: getTier(data['Course Default Price']),
      price: data['Course Default Price'],
      discountedPrice: data['Course Discounted Price'] || null,
      skillLevel: data['skill 1'] || 'Beginner',
      stripeProductId: data['stripe product id'] || null,
      uniqueId: data['unique id'],
      thumbnailUrl: data['Image'] ? `https:${data['Image']}` : null,
      isPublished: true,
    };
    
    try {
      const createdCourse = await storage.createCourse(course);
      console.log(`Created course: ${createdCourse.title}`);
      
      // Parse module IDs and create modules
      const moduleIds = parseModulesIds(data['modules']);
      
      for (let i = 0; i < moduleIds.length; i++) {
        const moduleId = moduleIds[i];
        const module = await storage.createCourseModule({
          courseId: createdCourse.id,
          title: `Module ${i + 1}`,
          description: `Module ${i + 1} content`,
          orderIndex: i + 1,
        });
        
        console.log(`Created module: ${module.title} for course ${createdCourse.title}`);
        
        // Create a sample submodule for each module
        await storage.createCourseSubmodule({
          moduleId: module.id,
          title: `Lesson ${i + 1}.1`,
          description: `First lesson of Module ${i + 1}`,
          content: `Content for lesson ${i + 1}.1`,
          orderIndex: 1,
        });
      }
      
    } catch (error) {
      console.error(`Error creating course ${data['Course Name']}:`, error);
    }
  }
  
  console.log('Course seeding completed!');
}

// Run if executed directly
if (import.meta.url === new URL(process.argv[1], 'file://').href) {
  seedCourses().catch(console.error);
}