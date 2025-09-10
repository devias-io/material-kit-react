// lib/dataConsolidation.ts
function extractPrice(brapi: any, yahoo: any, hg: any) {
  if (brapi.status === 'fulfilled' && brapi.value?.regularMarketPrice) {
    return brapi.value.regularMarketPrice;
  }
  if (yahoo.status === 'fulfilled' && yahoo.value?.price) {
    return yahoo.value.price;
  }
  if (hg.status === 'fulfilled' && hg.value?.price) {
    return hg.value.price;
  }
  return null;
}

function extractPL(hg: any, brapi: any, yahoo: any) {
  // HG Brasil tem melhor qualidade para ativos BR
  if (hg.status === 'fulfilled' && hg.value?.pl && hg.value.pl > 0 && hg.value.pl < 1000) {
    return hg.value.pl;
  }
  if (brapi.status === 'fulfilled' && brapi.value?.pl && brapi.value.pl > 0) {
    return brapi.value.pl;
  }
  if (yahoo.status === 'fulfilled' && yahoo.value?.pl && yahoo.value.pl > 0) {
    return yahoo.value.pl;
  }
  return null;
}

function calculateDataQuality(hg: any, yahoo: any, brapi: any) {
  let score = 0;
  if (hg.status === 'fulfilled') score += 30;
  if (yahoo.status === 'fulfilled') score += 35;
  if (brapi.status === 'fulfilled') score += 35;
  
  return {
    score,
    level: score > 80 ? 'high' : score > 50 ? 'medium' : 'low'
  };
}