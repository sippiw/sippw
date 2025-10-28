// 🧥 Cloudflare Worker Script - V4 (Creation Only + Infinite Pagination)
// By ChatGPT | 2025
// ✅ Hanya menampilkan outfit "Creation" (buatan user sendiri)
// ✅ Mendukung pagination otomatis (semua halaman diambil)

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function fetchOutfitsRecursively(userId, cursor, allOutfits = []) {
  const ITEMS_PER_PAGE = 50; // maksimum 50 per halaman Roblox
  let url = `https://avatar.roblox.com/v1/users/${userId}/outfits?isEditable=true&itemsPerPage=${ITEMS_PER_PAGE}`;
  
  if (cursor) {
    url += `&cursor=${cursor}`;
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Roblox API returned status ${response.status}`);
  }

  const data = await response.json();

  // Filter hanya outfit creation (isEditable=true sudah di API)
  if (data.data && data.data.length > 0) {
    const filteredOutfits = data.data.map(outfit => ({
      id: outfit.id,
      name: outfit.name,
      isEditable: outfit.isEditable,
      lastUpdated: outfit.lastUpdated,
    }));
    allOutfits.push(...filteredOutfits);
  }

  // Rekursif kalau masih ada halaman berikutnya
  if (data.nextPageCursor) {
    return await fetchOutfitsRecursively(userId, data.nextPageCursor, allOutfits);
  }

  // Kembalikan semua hasil (tidak ada halaman berikutnya)
  return allOutfits;
}

async function handleRequest(request) {
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId');

  if (!userId) {
    return new Response(JSON.stringify({ success: false, error: 'Missing userId parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const allOutfits = await fetchOutfitsRecursively(userId, null);

    return new Response(
      JSON.stringify({ success: true, total: allOutfits.length, outfits: allOutfits }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to fetch creation outfits from Roblox API',
        detail: e.message,
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}
