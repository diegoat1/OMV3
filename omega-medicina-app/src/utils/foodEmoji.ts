/**
 * Returns an emoji icon for a given food name based on keyword matching.
 * Designed for the OMV3 Argentine nutrition app (~187 foods, Spanish names).
 */
export function getFoodEmoji(name: string): string {
  const lower = name.toLowerCase();

  // Oils & Fats
  if (lower.includes('aceite')) return '🫒';
  if (lower.includes('manteca') && !lower.includes('mani')) return '🧈';
  if (lower.includes('mantequilla de mani') || lower === 'maní') return '🥜';
  if (lower.includes('crema de leche')) return '🥛';

  // Vegetables
  if (lower.includes('acelga') || lower.includes('espinaca')) return '🥬';
  if (lower.includes('ajo')) return '🧄';
  if (lower.includes('brocoli') || lower.includes('brócoli')) return '🥦';
  if (lower.includes('cebolla')) return '🧅';
  if (lower.includes('choclo')) return '🌽';
  if (lower.includes('berenjena')) return '🍆';
  if (lower.includes('lechuga')) return '🥬';
  if (lower.includes('pepino')) return '🥒';
  if (lower.includes('pimiento')) return '🫑';
  if (lower.includes('tomate')) return '🍅';
  if (lower.includes('zanahoria')) return '🥕';
  if (lower.includes('zapallito') || lower.includes('zapallo')) return '🎃';
  if (lower.includes('papas fritas')) return '🍟';
  if (lower.includes('papa')) return '🥔';
  if (lower.includes('batata')) return '🍠';
  if (lower.includes('esparrago') || lower.includes('espárrago')) return '🌿';
  if (lower.includes('repollo') || lower.includes('coliflor')) return '🥦';
  if (lower.includes('palta')) return '🥑';
  if (lower.includes('verdura')) return '🥗';

  // Fruits
  if (lower.includes('banana')) return '🍌';
  if (lower.includes('manzana')) return '🍎';
  if (lower.includes('naranja')) return '🍊';
  if (lower.includes('frutilla')) return '🍓';
  if (lower.includes('durazno') || lower.includes('albaricoque')) return '🍑';
  if (lower.includes('pera')) return '🍐';
  if (lower.includes('uva')) return '🍇';
  if (lower.includes('sandia') || lower.includes('sandía')) return '🍉';
  if (lower.includes('kiwi')) return '🥝';
  if (lower.includes('mango')) return '🥭';
  if (lower.includes('anana') || lower.includes('ananá')) return '🍍';
  if (lower.includes('arandano') || lower.includes('arándano') || lower.includes('mora')) return '🫐';
  if (lower.includes('ciruela')) return '🟣';
  if (lower.includes('cereza')) return '🍒';
  if (lower.includes('limon') || lower.includes('limón')) return '🍋';
  if (lower.includes('frutas') || lower.includes('fruta')) return '🍎';

  // Meats
  if (lower.includes('pollo')) return '🍗';
  if (lower.includes('carne') || lower.includes('bife') || lower.includes('lomo') || lower.includes('costilla')) return '🥩';
  if (lower.includes('cerdo') || lower.includes('pernil') || lower.includes('tocino')) return '🥓';
  if (lower.includes('milanesa')) return '🍖';
  if (lower.includes('hamburguesa')) return '🍔';
  if (lower.includes('salchicha') || lower.includes('choripan')) return '🌭';
  if (lower.includes('medallon') || lower.includes('nugget')) return '🍗';
  if (lower.includes('jamon') || lower.includes('jamón') || lower.includes('paleta')) return '🥓';

  // Fish & Seafood
  if (lower.includes('atun') || lower.includes('atún') || lower.includes('sardina') || lower.includes('anchoa') || lower.includes('pescado') || lower.includes('merluza') || lower.includes('salmon') || lower.includes('salmón')) return '🐟';

  // Eggs
  if (lower.includes('huevo') || lower.includes('clara de huevo') || lower.includes('yema')) return '🥚';

  // Dairy
  if (lower.includes('leche chocolatada')) return '🍫';
  if (lower.includes('leche')) return '🥛';
  if (lower.includes('yogur')) return '🥛';
  if (lower.includes('queso')) return '🧀';
  if (lower.includes('dulce de leche')) return '🍯';

  // Grains & Cereals
  if (lower.includes('arroz')) return '🍚';
  if (lower.includes('avena')) return '🥣';
  if (lower.includes('granola')) return '🥣';
  if (lower.includes('quinoa') || lower.includes('amaranto')) return '🌾';
  if (lower.includes('polenta')) return '🌽';
  if (lower.includes('cereal') || lower.includes('fitness') || lower.includes('almohaditas')) return '🥣';

  // Pasta
  if (lower.includes('fideo') || lower.includes('pasta') || lower.includes('espagueti')) return '🍝';
  if (lower.includes('raviole')) return '🥟';

  // Bread & Bakery
  if (lower.includes('pan ') || lower.startsWith('pan ') || lower.includes('pan arabe') || lower.includes('pan danes') || lower.includes('pan dulce') || lower.includes('pan rallado')) return '🍞';
  if (lower.includes('factura') || lower.includes('medialuna')) return '🥐';
  if (lower.includes('galletita') || lower.includes('cracker') || lower.includes('bizcocho')) return '🍪';
  if (lower.includes('alfajor')) return '🍫';
  if (lower.includes('harina')) return '🌾';

  // Legumes
  if (lower.includes('lenteja') || lower.includes('garbanzo') || lower.includes('poroto')) return '🫘';

  // Nuts & Seeds
  if (lower.includes('almendra') || lower.includes('nuez') || lower.includes('nueces') || lower.includes('avellana') || lower.includes('castaña')) return '🌰';
  if (lower.includes('maní') || lower.includes('mani')) return '🥜';

  // Sweets
  if (lower.includes('chocolate') || lower.includes('cacao')) return '🍫';
  if (lower.includes('miel') || lower.includes('mermelada')) return '🍯';
  if (lower.includes('helado')) return '🍦';
  if (lower.includes('azucar') || lower.includes('azúcar') || lower.includes('turron') || lower.includes('dulce de membrillo')) return '🍬';

  // Prepared
  if (lower.includes('pizza')) return '🍕';
  if (lower.includes('empanada') || lower.includes('tapa')) return '🥟';
  if (lower.includes('guiso')) return '🍲';
  if (lower.includes('sandwich') || lower.includes('sándwich')) return '🥪';
  if (lower.includes('pororo')) return '🍿';

  // Drinks
  if (lower.includes('jugo') || lower.includes('ades')) return '🧃';

  // Supplements
  if (lower.includes('proteina en polvo') || lower.includes('proteína')) return '💪';

  return '🍽️';
}
