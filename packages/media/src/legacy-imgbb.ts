/**
 * Where each bucket key's bytes lived before the move to R2, frozen at the
 * moment of the migration. `media:import --verify` is the only reader: it
 * refetches these and checks the repo's copy is byte-identical. Nothing else
 * should ever grow an ibb.co URL again.
 *
 * `fromStarterPack: false` marks a key with no Frontend Mentor original — its
 * bytes came from ImgBB, so verification is a round trip, not a comparison.
 *
 * One key is deliberately absent: XX99 Mark II's `primary-desktop.jpg` had no
 * correct predecessor, because the seed's desktop primary URL pointed at the
 * category-page preview by mistake. It is a fix, not a migration, so there is
 * nothing to verify it against.
 */
export type LegacyOrigin = {
  key: string;
  imgbbUrl: string;
  fromStarterPack: boolean;
};

export const LEGACY_ORIGINS: readonly LegacyOrigin[] = [
  {
    key: "products/xx59-headphones/intro-mobile.jpg",
    imgbbUrl: "https://i.ibb.co/GW2sLXQ/image-category-page-preview.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/xx59-headphones/intro-tablet.jpg",
    imgbbUrl: "https://i.ibb.co/wcdK5gS/image-category-page-preview.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/xx59-headphones/intro-desktop.jpg",
    imgbbUrl: "https://i.ibb.co/pbrXfT4/image-category-page-preview.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/xx59-headphones/primary-mobile.jpg",
    imgbbUrl: "https://i.ibb.co/QcbZCLB/image-product.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/xx59-headphones/primary-tablet.jpg",
    imgbbUrl: "https://i.ibb.co/zZ0dWtM/image-product.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/xx59-headphones/primary-desktop.jpg",
    imgbbUrl: "https://i.ibb.co/k1NhDKS/image-product.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/xx59-headphones/gallery-1-mobile.jpg",
    imgbbUrl: "https://i.ibb.co/8BHFV2z/image-gallery-1.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/xx59-headphones/gallery-1-tablet.jpg",
    imgbbUrl: "https://i.ibb.co/Swz1vsc/image-gallery-1.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/xx59-headphones/gallery-1-desktop.jpg",
    imgbbUrl: "https://i.ibb.co/StPPyRW/image-gallery-1.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/xx59-headphones/gallery-2-mobile.jpg",
    imgbbUrl: "https://i.ibb.co/8dNKd3z/image-gallery-2.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/xx59-headphones/gallery-2-tablet.jpg",
    imgbbUrl: "https://i.ibb.co/CPpW92Q/image-gallery-2.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/xx59-headphones/gallery-2-desktop.jpg",
    imgbbUrl: "https://i.ibb.co/Vq3MhXp/image-gallery-2.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/xx59-headphones/gallery-3-mobile.jpg",
    imgbbUrl: "https://i.ibb.co/VLHfQwP/image-gallery-3.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/xx59-headphones/gallery-3-tablet.jpg",
    imgbbUrl: "https://i.ibb.co/X4RhLBK/image-gallery-3.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/xx59-headphones/gallery-3-desktop.jpg",
    imgbbUrl: "https://i.ibb.co/vh2380K/image-gallery-3.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/xx59-headphones/related-mobile.jpg",
    imgbbUrl: "https://i.ibb.co/H2gYBGK/suggestion-xx59-headphones.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/xx59-headphones/related-tablet.jpg",
    imgbbUrl: "https://i.ibb.co/R6hb1zP/suggestion-xx59-headphones.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/xx59-headphones/related-desktop.jpg",
    imgbbUrl: "https://i.ibb.co/58cCyPM/suggestion-xx59-headphones.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/xx59-headphones/thumbnail.jpg",
    imgbbUrl: "https://i.ibb.co/7jQ3fVy/image-cart-xx59-headphones.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/xx99-mark-one-headphones/intro-mobile.jpg",
    imgbbUrl: "https://i.ibb.co/XXrzDdZ/image-category-page-preview.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/xx99-mark-one-headphones/intro-tablet.jpg",
    imgbbUrl: "https://i.ibb.co/NFFzMbM/image-category-page-preview.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/xx99-mark-one-headphones/intro-desktop.jpg",
    imgbbUrl: "https://i.ibb.co/ph6gQpx/image-category-page-preview.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/xx99-mark-one-headphones/primary-mobile.jpg",
    imgbbUrl: "https://i.ibb.co/QprMpxs/image-product.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/xx99-mark-one-headphones/primary-tablet.jpg",
    imgbbUrl: "https://i.ibb.co/99Zm9Rr/image-product.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/xx99-mark-one-headphones/primary-desktop.jpg",
    imgbbUrl: "https://i.ibb.co/CVm0C1w/image-product.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/xx99-mark-one-headphones/gallery-1-mobile.jpg",
    imgbbUrl: "https://i.ibb.co/sv663Lm/image-gallery-1.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/xx99-mark-one-headphones/gallery-1-tablet.jpg",
    imgbbUrl: "https://i.ibb.co/YR2bdLh/image-gallery-1.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/xx99-mark-one-headphones/gallery-1-desktop.jpg",
    imgbbUrl: "https://i.ibb.co/LJgkLDL/image-gallery-1.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/xx99-mark-one-headphones/gallery-2-mobile.jpg",
    imgbbUrl: "https://i.ibb.co/61Zx319/image-gallery-2.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/xx99-mark-one-headphones/gallery-2-tablet.jpg",
    imgbbUrl: "https://i.ibb.co/8gR7cjR/image-gallery-2.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/xx99-mark-one-headphones/gallery-2-desktop.jpg",
    imgbbUrl: "https://i.ibb.co/5G86BgK/image-gallery-2.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/xx99-mark-one-headphones/gallery-3-mobile.jpg",
    imgbbUrl: "https://i.ibb.co/c8PzZMH/image-gallery-3.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/xx99-mark-one-headphones/gallery-3-tablet.jpg",
    imgbbUrl: "https://i.ibb.co/TTJyD2f/image-gallery-3.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/xx99-mark-one-headphones/gallery-3-desktop.jpg",
    imgbbUrl: "https://i.ibb.co/ZdpfbrT/image-gallery-3.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/xx99-mark-one-headphones/related-mobile.jpg",
    imgbbUrl:
      "https://i.ibb.co/VD1wcFX/suggestion-xx99-mark-one-headphones.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/xx99-mark-one-headphones/related-tablet.jpg",
    imgbbUrl:
      "https://i.ibb.co/cDg5h80/suggestion-xx99-mark-one-headphones.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/xx99-mark-one-headphones/related-desktop.jpg",
    imgbbUrl:
      "https://i.ibb.co/9pLLMqZ/suggestion-xx99-mark-one-headphones.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/xx99-mark-one-headphones/thumbnail.jpg",
    imgbbUrl:
      "https://i.ibb.co/hZssHbt/image-cart-xx99-mark-one-headphones.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/xx99-mark-two-headphones/intro-mobile.jpg",
    imgbbUrl: "https://i.ibb.co/HNDwB2S/image-category-page-preview.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/xx99-mark-two-headphones/intro-tablet.jpg",
    imgbbUrl: "https://i.ibb.co/4TV936h/image-category-page-preview.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/xx99-mark-two-headphones/intro-desktop.jpg",
    imgbbUrl: "https://i.ibb.co/z87sVHt/image-category-page-preview.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/xx99-mark-two-headphones/primary-mobile.jpg",
    imgbbUrl: "https://i.ibb.co/jVqc5GK/image-product.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/xx99-mark-two-headphones/primary-tablet.jpg",
    imgbbUrl: "https://i.ibb.co/FYfVP1W/image-product.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/xx99-mark-two-headphones/featured-mobile.jpg",
    imgbbUrl: "https://i.ibb.co/kxCssZK/image-header.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/xx99-mark-two-headphones/featured-tablet.jpg",
    imgbbUrl: "https://i.ibb.co/3rh9J1n/image-header.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/xx99-mark-two-headphones/featured-desktop.jpg",
    imgbbUrl: "https://i.ibb.co/xMg8rVh/image-hero.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/xx99-mark-two-headphones/gallery-1-mobile.jpg",
    imgbbUrl: "https://i.ibb.co/ykmC1KG/image-gallery-1.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/xx99-mark-two-headphones/gallery-1-tablet.jpg",
    imgbbUrl: "https://i.ibb.co/HXxnfCg/image-gallery-1.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/xx99-mark-two-headphones/gallery-1-desktop.jpg",
    imgbbUrl: "https://i.ibb.co/wWVx6WX/image-gallery-1.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/xx99-mark-two-headphones/gallery-2-mobile.jpg",
    imgbbUrl: "https://i.ibb.co/MhcygKH/image-gallery-2.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/xx99-mark-two-headphones/gallery-2-tablet.jpg",
    imgbbUrl: "https://i.ibb.co/Bz9Bcnv/image-gallery-2.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/xx99-mark-two-headphones/gallery-2-desktop.jpg",
    imgbbUrl: "https://i.ibb.co/TT1jvpw/image-gallery-2.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/xx99-mark-two-headphones/gallery-3-mobile.jpg",
    imgbbUrl: "https://i.ibb.co/ZB1NGtd/image-gallery-3.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/xx99-mark-two-headphones/gallery-3-tablet.jpg",
    imgbbUrl: "https://i.ibb.co/PWn8FpM/image-gallery-3.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/xx99-mark-two-headphones/gallery-3-desktop.jpg",
    imgbbUrl: "https://i.ibb.co/pbdzG8q/image-gallery-3.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/xx99-mark-two-headphones/related-mobile.jpg",
    imgbbUrl:
      "https://i.ibb.co/7rFpc0S/suggestion-xx99-mark-two-headphones.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/xx99-mark-two-headphones/related-tablet.jpg",
    imgbbUrl:
      "https://i.ibb.co/XZjbh9y/suggestion-xx99-mark-two-headphones.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/xx99-mark-two-headphones/related-desktop.jpg",
    imgbbUrl:
      "https://i.ibb.co/sm47rZ8/suggestion-xx99-mark-two-headphones.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/xx99-mark-two-headphones/thumbnail.jpg",
    imgbbUrl:
      "https://i.ibb.co/K0drZF6/image-cart-xx99-mark-two-headphones.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/yx1-wireless-earphones/intro-mobile.jpg",
    imgbbUrl: "https://i.ibb.co/4VgG2yk/image-category-page-preview.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/yx1-wireless-earphones/intro-tablet.jpg",
    imgbbUrl: "https://i.ibb.co/M1HBvBH/image-category-page-preview.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/yx1-wireless-earphones/intro-desktop.jpg",
    imgbbUrl: "https://i.ibb.co/Bg50YkS/image-category-page-preview.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/yx1-wireless-earphones/primary-mobile.jpg",
    imgbbUrl: "https://i.ibb.co/yn2Px06/image-product.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/yx1-wireless-earphones/primary-tablet.jpg",
    imgbbUrl: "https://i.ibb.co/K0DdSQ6/image-product.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/yx1-wireless-earphones/primary-desktop.jpg",
    imgbbUrl: "https://i.ibb.co/HChWspP/image-product.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/yx1-wireless-earphones/showcase-mobile.jpg",
    imgbbUrl: "https://i.ibb.co/P93T22W/spotlight-earphones-yx1.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/yx1-wireless-earphones/showcase-tablet.jpg",
    imgbbUrl: "https://i.ibb.co/CM1jWGx/spotlight-earphones-yx1.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/yx1-wireless-earphones/showcase-desktop.jpg",
    imgbbUrl: "https://i.ibb.co/s9BvSVC/spotlight-earphones-yx1.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/yx1-wireless-earphones/gallery-1-mobile.jpg",
    imgbbUrl: "https://i.ibb.co/nPVYpHY/image-gallery-1.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/yx1-wireless-earphones/gallery-1-tablet.jpg",
    imgbbUrl: "https://i.ibb.co/Ldjy7tp/image-gallery-1.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/yx1-wireless-earphones/gallery-1-desktop.jpg",
    imgbbUrl: "https://i.ibb.co/TgQbNW7/image-gallery-1.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/yx1-wireless-earphones/gallery-2-mobile.jpg",
    imgbbUrl: "https://i.ibb.co/vDRz9Jt/image-gallery-2.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/yx1-wireless-earphones/gallery-2-tablet.jpg",
    imgbbUrl: "https://i.ibb.co/2NJg9DF/image-gallery-2.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/yx1-wireless-earphones/gallery-2-desktop.jpg",
    imgbbUrl: "https://i.ibb.co/K9sxvqW/image-gallery-2.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/yx1-wireless-earphones/gallery-3-mobile.jpg",
    imgbbUrl: "https://i.ibb.co/JnmNKnf/image-gallery-3.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/yx1-wireless-earphones/gallery-3-tablet.jpg",
    imgbbUrl: "https://i.ibb.co/gmhYVXc/image-gallery-3.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/yx1-wireless-earphones/gallery-3-desktop.jpg",
    imgbbUrl: "https://i.ibb.co/khPfFQk/image-gallery-3.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/yx1-wireless-earphones/related-mobile.jpg",
    imgbbUrl: "https://i.ibb.co/bgytMWC6/suggestion-earphones-yx1.jpg",
    fromStarterPack: false,
  },
  {
    key: "products/yx1-wireless-earphones/related-tablet.jpg",
    imgbbUrl: "https://i.ibb.co/yn0Bk7QK/suggestion-earphones-yx1.jpg",
    fromStarterPack: false,
  },
  {
    key: "products/yx1-wireless-earphones/related-desktop.jpg",
    imgbbUrl: "https://i.ibb.co/7dFt2Cnr/suggestion-earphones-yx1.jpg",
    fromStarterPack: false,
  },
  {
    key: "products/yx1-wireless-earphones/thumbnail.jpg",
    imgbbUrl: "https://i.ibb.co/sWDYF9b/image-cart-yx1-earphones.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/zx7-speaker/intro-mobile.jpg",
    imgbbUrl: "https://i.ibb.co/YBH1ftJ/image-category-page-preview.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/zx7-speaker/intro-tablet.jpg",
    imgbbUrl: "https://i.ibb.co/02TnHqp/image-category-page-preview.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/zx7-speaker/intro-desktop.jpg",
    imgbbUrl: "https://i.ibb.co/vjxw4Ld/image-category-page-preview.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/zx7-speaker/primary-mobile.jpg",
    imgbbUrl: "https://i.ibb.co/RpnzYw7/image-product.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/zx7-speaker/primary-tablet.jpg",
    imgbbUrl: "https://i.ibb.co/fYt9L6S/image-product.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/zx7-speaker/primary-desktop.jpg",
    imgbbUrl: "https://i.ibb.co/RP5MRH7/image-product.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/zx7-speaker/showcase-mobile.jpg",
    imgbbUrl: "https://i.ibb.co/8Yx9XdD/spotlight-speaker-zx7.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/zx7-speaker/showcase-tablet.jpg",
    imgbbUrl: "https://i.ibb.co/pvC6yyV/spotlight-speaker-zx7.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/zx7-speaker/showcase-desktop.jpg",
    imgbbUrl: "https://i.ibb.co/zStT1C3/spotlight-speaker-zx7.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/zx7-speaker/gallery-1-mobile.jpg",
    imgbbUrl: "https://i.ibb.co/NpFFRy2/image-gallery-1.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/zx7-speaker/gallery-1-tablet.jpg",
    imgbbUrl: "https://i.ibb.co/wJbccf6/image-gallery-1.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/zx7-speaker/gallery-1-desktop.jpg",
    imgbbUrl: "https://i.ibb.co/8KpQTYw/image-gallery-1.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/zx7-speaker/gallery-2-mobile.jpg",
    imgbbUrl: "https://i.ibb.co/8rP3YWZ/image-gallery-2.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/zx7-speaker/gallery-2-tablet.jpg",
    imgbbUrl: "https://i.ibb.co/JjZ6rNt/image-gallery-2.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/zx7-speaker/gallery-2-desktop.jpg",
    imgbbUrl: "https://i.ibb.co/BC6Qhyv/image-gallery-2.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/zx7-speaker/gallery-3-mobile.jpg",
    imgbbUrl: "https://i.ibb.co/W5H2fb2/image-gallery-3.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/zx7-speaker/gallery-3-tablet.jpg",
    imgbbUrl: "https://i.ibb.co/P4QpkbL/image-gallery-3.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/zx7-speaker/gallery-3-desktop.jpg",
    imgbbUrl: "https://i.ibb.co/xsxjCCH/image-gallery-3.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/zx7-speaker/related-mobile.jpg",
    imgbbUrl: "https://i.ibb.co/936QtTm/suggestion-zx7-speaker.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/zx7-speaker/related-tablet.jpg",
    imgbbUrl: "https://i.ibb.co/7kq9drn/suggestion-zx7-speaker.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/zx7-speaker/related-desktop.jpg",
    imgbbUrl: "https://i.ibb.co/gynNLFC/suggestion-zx7-speaker.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/zx7-speaker/thumbnail.jpg",
    imgbbUrl: "https://i.ibb.co/48YdKt9/image-cart-zx7-speaker.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/zx9-speaker/intro-mobile.jpg",
    imgbbUrl: "https://i.ibb.co/X7M3Xmt/image-category-page-preview.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/zx9-speaker/intro-tablet.jpg",
    imgbbUrl: "https://i.ibb.co/tsRGQbY/image-category-page-preview.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/zx9-speaker/intro-desktop.jpg",
    imgbbUrl: "https://i.ibb.co/5vk9NRG/image-category-page-preview.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/zx9-speaker/primary-mobile.jpg",
    imgbbUrl: "https://i.ibb.co/BCsCYRh/image-product.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/zx9-speaker/primary-tablet.jpg",
    imgbbUrl: "https://i.ibb.co/9Wy9CJc/image-product.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/zx9-speaker/primary-desktop.jpg",
    imgbbUrl: "https://i.ibb.co/9p2xjfW/image-product.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/zx9-speaker/showcase-mobile.png",
    imgbbUrl: "https://i.ibb.co/K9h7Q9g/spotlight-speaker-zx9.png",
    fromStarterPack: true,
  },
  {
    key: "products/zx9-speaker/showcase-tablet.png",
    imgbbUrl: "https://i.ibb.co/sH744pm/spotlight-speaker-zx9.png",
    fromStarterPack: true,
  },
  {
    key: "products/zx9-speaker/showcase-desktop.png",
    imgbbUrl: "https://i.ibb.co/FnrB0yJ/spotlight-speaker-zx9.png",
    fromStarterPack: true,
  },
  {
    key: "products/zx9-speaker/gallery-1-mobile.jpg",
    imgbbUrl: "https://i.ibb.co/SBnHtMC/image-gallery-1.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/zx9-speaker/gallery-1-tablet.jpg",
    imgbbUrl: "https://i.ibb.co/Tr0ZfwX/image-gallery-1.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/zx9-speaker/gallery-1-desktop.jpg",
    imgbbUrl: "https://i.ibb.co/V2b4Kyz/image-gallery-1.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/zx9-speaker/gallery-2-mobile.jpg",
    imgbbUrl: "https://i.ibb.co/d2YsMw1/image-gallery-2.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/zx9-speaker/gallery-2-tablet.jpg",
    imgbbUrl: "https://i.ibb.co/HqRC0fr/image-gallery-2.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/zx9-speaker/gallery-2-desktop.jpg",
    imgbbUrl: "https://i.ibb.co/Xpg3cbt/image-gallery-2.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/zx9-speaker/gallery-3-mobile.jpg",
    imgbbUrl: "https://i.ibb.co/LPCq2TR/image-gallery-3.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/zx9-speaker/gallery-3-tablet.jpg",
    imgbbUrl: "https://i.ibb.co/kSvHPNT/image-gallery-3.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/zx9-speaker/gallery-3-desktop.jpg",
    imgbbUrl: "https://i.ibb.co/hswPCmn/image-gallery-3.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/zx9-speaker/related-mobile.jpg",
    imgbbUrl: "https://i.ibb.co/XCmMRy0/suggestion-zx9-speaker.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/zx9-speaker/related-tablet.jpg",
    imgbbUrl: "https://i.ibb.co/frQFffg/suggestion-zx9-speaker.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/zx9-speaker/related-desktop.jpg",
    imgbbUrl: "https://i.ibb.co/GJ1SX7K/suggestion-zx9-speaker.jpg",
    fromStarterPack: true,
  },
  {
    key: "products/zx9-speaker/thumbnail.jpg",
    imgbbUrl: "https://i.ibb.co/w0p3n9K/image-cart-zx9-speaker.jpg",
    fromStarterPack: true,
  },
  {
    key: "categories/headphones/thumbnail.png",
    imgbbUrl:
      "https://i.ibb.co/6r3M9v9/image-category-thumbnail-headphones.png",
    fromStarterPack: true,
  },
  {
    key: "categories/earphones/thumbnail.png",
    imgbbUrl: "https://i.ibb.co/9Z0BpQC/image-category-thumbnail-earphones.png",
    fromStarterPack: true,
  },
  {
    key: "categories/speakers/thumbnail.png",
    imgbbUrl: "https://i.ibb.co/xfMTGtm/image-category-thumbnail-speakers.png",
    fromStarterPack: true,
  },
];
