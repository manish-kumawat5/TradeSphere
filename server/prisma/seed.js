const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const MUTUAL_FUNDS = [
  {
    name: 'HDFC Flexi Cap Fund',
    category: 'EQUITY',
    riskLevel: 'HIGH',
    nav: 1523.45,
    expenseRatio: 1.74,
    aum: 45230,
    return1Y: 18.5,
    return3Y: 22.3,
    return5Y: 16.8,
    minInvestment: 500,
    minSipAmount: 500,
    fundManager: 'Roshi Jain',
    fundHouse: 'HDFC AMC',
    launchDate: new Date('2004-06-01'),
    description: 'An open-ended dynamic equity scheme investing across large cap, mid cap, small cap stocks.'
  },
  {
    name: 'ICICI Prudential Bluechip Fund',
    category: 'EQUITY',
    riskLevel: 'HIGH',
    nav: 89.32,
    expenseRatio: 1.69,
    aum: 52840,
    return1Y: 16.2,
    return3Y: 19.8,
    return5Y: 15.4,
    minInvestment: 500,
    minSipAmount: 500,
    fundManager: 'Anish Tawakley',
    fundHouse: 'ICICI Prudential AMC',
    launchDate: new Date('2008-05-23'),
    description: 'Invests predominantly in large cap stocks with a focus on quality and growth.'
  },
  {
    name: 'SBI Small Cap Fund',
    category: 'EQUITY',
    riskLevel: 'HIGH',
    nav: 156.78,
    expenseRatio: 1.82,
    aum: 28560,
    return1Y: 28.4,
    return3Y: 30.1,
    return5Y: 24.6,
    minInvestment: 500,
    minSipAmount: 500,
    fundManager: 'R. Srinivasan',
    fundHouse: 'SBI Funds Management',
    launchDate: new Date('2009-09-09'),
    description: 'An open-ended equity scheme predominantly investing in small cap stocks.'
  },
  {
    name: 'Axis Midcap Fund',
    category: 'EQUITY',
    riskLevel: 'HIGH',
    nav: 102.45,
    expenseRatio: 1.65,
    aum: 23450,
    return1Y: 21.7,
    return3Y: 24.5,
    return5Y: 19.2,
    minInvestment: 500,
    minSipAmount: 500,
    fundManager: 'Shreyash Devalkar',
    fundHouse: 'Axis AMC',
    launchDate: new Date('2011-02-18'),
    description: 'Focuses on mid-cap companies with strong growth potential and sustainable business models.'
  },
  {
    name: 'Mirae Asset Large Cap Fund',
    category: 'EQUITY',
    riskLevel: 'MODERATE',
    nav: 95.67,
    expenseRatio: 1.53,
    aum: 38920,
    return1Y: 14.8,
    return3Y: 17.2,
    return5Y: 14.1,
    minInvestment: 500,
    minSipAmount: 500,
    fundManager: 'Gaurav Misra',
    fundHouse: 'Mirae Asset MF',
    launchDate: new Date('2015-04-03'),
    description: 'Invests in large cap companies with strong fundamentals and sustainable competitive advantages.'
  },
  {
    name: 'Parag Parikh Flexi Cap Fund',
    category: 'EQUITY',
    riskLevel: 'MODERATE',
    nav: 72.15,
    expenseRatio: 1.33,
    aum: 56780,
    return1Y: 20.3,
    return3Y: 23.8,
    return5Y: 18.9,
    minInvestment: 1000,
    minSipAmount: 1000,
    fundManager: 'Rajeev Thakkar',
    fundHouse: 'PPFAS AMC',
    launchDate: new Date('2013-05-28'),
    description: 'Invests in Indian and international equities with a value investing approach.'
  },
  {
    name: 'HDFC Corporate Bond Fund',
    category: 'DEBT',
    riskLevel: 'LOW',
    nav: 28.92,
    expenseRatio: 0.6,
    aum: 29400,
    return1Y: 7.8,
    return3Y: 7.2,
    return5Y: 7.5,
    minInvestment: 500,
    minSipAmount: 500,
    fundManager: 'Anil Bamboli',
    fundHouse: 'HDFC AMC',
    launchDate: new Date('2010-06-29'),
    description: 'Invests predominantly in AA+ and above rated corporate bonds for stable returns.'
  },
  {
    name: 'ICICI Prudential Short Term Fund',
    category: 'DEBT',
    riskLevel: 'LOW',
    nav: 52.41,
    expenseRatio: 0.88,
    aum: 19870,
    return1Y: 7.1,
    return3Y: 6.8,
    return5Y: 7.0,
    minInvestment: 500,
    minSipAmount: 500,
    fundManager: 'Manish Banthia',
    fundHouse: 'ICICI Prudential AMC',
    launchDate: new Date('2009-01-19'),
    description: 'Invests in short-duration debt and money market instruments for steady income.'
  },
  {
    name: 'SBI Magnum Gilt Fund',
    category: 'DEBT',
    riskLevel: 'MODERATE',
    nav: 62.35,
    expenseRatio: 0.72,
    aum: 8930,
    return1Y: 8.2,
    return3Y: 7.9,
    return5Y: 8.1,
    minInvestment: 500,
    minSipAmount: 500,
    fundManager: 'Dinesh Ahuja',
    fundHouse: 'SBI Funds Management',
    launchDate: new Date('2000-12-30'),
    description: 'Invests in government securities across different maturities for safety and returns.'
  },
  {
    name: 'Axis Liquid Fund',
    category: 'DEBT',
    riskLevel: 'LOW',
    nav: 2521.08,
    expenseRatio: 0.22,
    aum: 34210,
    return1Y: 6.5,
    return3Y: 5.8,
    return5Y: 5.9,
    minInvestment: 500,
    minSipAmount: 500,
    fundManager: 'Devang Shah',
    fundHouse: 'Axis AMC',
    launchDate: new Date('2009-10-09'),
    description: 'Invests in short-term money market instruments for high liquidity and stable returns.'
  },
  {
    name: 'HDFC Balanced Advantage Fund',
    category: 'HYBRID',
    riskLevel: 'MODERATE',
    nav: 415.28,
    expenseRatio: 1.47,
    aum: 71250,
    return1Y: 15.2,
    return3Y: 18.6,
    return5Y: 14.3,
    minInvestment: 500,
    minSipAmount: 500,
    fundManager: 'Gopal Agrawal',
    fundHouse: 'HDFC AMC',
    launchDate: new Date('2000-02-01'),
    description: 'Dynamically manages allocation between equity and debt based on market valuations.'
  },
  {
    name: 'ICICI Prudential Equity & Debt Fund',
    category: 'HYBRID',
    riskLevel: 'MODERATE',
    nav: 312.56,
    expenseRatio: 1.62,
    aum: 37890,
    return1Y: 17.8,
    return3Y: 21.4,
    return5Y: 16.2,
    minInvestment: 500,
    minSipAmount: 500,
    fundManager: 'Sankaran Naren',
    fundHouse: 'ICICI Prudential AMC',
    launchDate: new Date('1999-11-03'),
    description: 'An aggressive hybrid fund investing in both equity and debt instruments.'
  },
  {
    name: 'SBI Equity Hybrid Fund',
    category: 'HYBRID',
    riskLevel: 'MODERATE',
    nav: 245.89,
    expenseRatio: 1.55,
    aum: 62340,
    return1Y: 14.5,
    return3Y: 17.1,
    return5Y: 13.8,
    minInvestment: 500,
    minSipAmount: 500,
    fundManager: 'R. Srinivasan',
    fundHouse: 'SBI Funds Management',
    launchDate: new Date('2003-12-31'),
    description: 'Invests in a mix of equity and debt with a focus on long-term capital appreciation.'
  },
  {
    name: 'Kotak Equity Opportunities Fund',
    category: 'EQUITY',
    riskLevel: 'HIGH',
    nav: 278.92,
    expenseRatio: 1.58,
    aum: 18540,
    return1Y: 22.1,
    return3Y: 25.3,
    return5Y: 18.7,
    minInvestment: 500,
    minSipAmount: 500,
    fundManager: 'Harsha Upadhyaya',
    fundHouse: 'Kotak AMC',
    launchDate: new Date('2004-09-08'),
    description: 'Large & mid cap fund investing in companies across market capitalizations.'
  },
  {
    name: 'Nippon India Arbitrage Fund',
    category: 'HYBRID',
    riskLevel: 'LOW',
    nav: 24.18,
    expenseRatio: 0.42,
    aum: 14230,
    return1Y: 7.4,
    return3Y: 6.1,
    return5Y: 5.8,
    minInvestment: 500,
    minSipAmount: 500,
    fundManager: 'Ashutosh Bhargava',
    fundHouse: 'Nippon India MF',
    launchDate: new Date('2010-08-26'),
    description: 'Generates returns through arbitrage opportunities between cash and derivatives markets.'
  }
];

async function main() {
  console.log('🌱 Seeding mutual funds...\n');

  // Clear existing mutual funds
  await prisma.fundTransaction.deleteMany();
  await prisma.sip.deleteMany();
  await prisma.mutualFund.deleteMany();

  // Insert mutual funds
  for (const fund of MUTUAL_FUNDS) {
    const created = await prisma.mutualFund.create({ data: fund });
    console.log(`  ✅ ${created.name} (NAV: ₹${created.nav})`);
  }

  console.log(`\n🎉 Successfully seeded ${MUTUAL_FUNDS.length} mutual funds!\n`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
