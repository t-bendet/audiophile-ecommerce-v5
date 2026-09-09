import { prisma, Prisma } from "../index.js";
import { CategoryName, ReadOutput } from "./categories.seed.js";

export type ProductCreateWithoutCategoryInput =
  Prisma.ProductCreateWithoutCategoryInput;

export type ProductCreateResult = Prisma.Result<
  typeof prisma.product,
  ProductCreateWithoutCategoryInput,
  "create"
>;

export const headphonesProductData: ProductCreateWithoutCategoryInput[] = [
  {
    name: "xx59 headphones",
    slug: "xx59-headphones",
    shortLabel: "XX59",
    cartLabel: "XX59",
    fullLabel: ["XX59", "Headphones"],
    description:
      "Enjoy your audio almost anywhere and customize it to your specific tastes with the XX59 Headphones. The stylish yet durable versatile wireless headset is a brilliant companion at home or on the move.",
    price: 899,
    isNewProduct: false,
    featuresText: [
      "These headphones have been created from durable, high-quality materials tough enough to take anywhere. Its compact folding design fuses comfort and minimalist style making it perfect for travel. Flawless transmission is assured by the latest wireless technology engineered for audio synchronization with videos.",
      "More than a simple pair of headphones, this headset features a pair of built-in microphones for clear, hands-free calling when paired with a compatible smartphone. Controlling music and calls is also intuitive thanks to easy-access touch buttons on the earcups. Regardless of how you use the XX59 Headphones, you can do so all day thanks to an impressive 30-hour battery life that can be rapidly recharged via USB-C.",
    ],
    includedItems: [
      {
        quantity: 1,
        item: "Headphone unit",
      },
      {
        quantity: 2,
        item: "Replacement earcups",
      },
      {
        quantity: 1,
        item: "User manual",
      },
      {
        quantity: 1,
        item: "3.5mm 5m audio cable",
      },
    ],
    images: {
      primaryImage: {
        mobileSrc:
          "https://audiophile-media.t-bendet.com/products/xx59-headphones/primary-mobile.jpg",
        tabletSrc:
          "https://audiophile-media.t-bendet.com/products/xx59-headphones/primary-tablet.jpg",
        desktopSrc:
          "https://audiophile-media.t-bendet.com/products/xx59-headphones/primary-desktop.jpg",
        ariaLabel: "XX59 Headphones primary image",
        altText:
          "White headphones positioned on a white backdrop, showcasing their design.",
      },
      introImage: {
        mobileSrc:
          "https://audiophile-media.t-bendet.com/products/xx59-headphones/intro-mobile.jpg",
        tabletSrc:
          "https://audiophile-media.t-bendet.com/products/xx59-headphones/intro-tablet.jpg",
        desktopSrc:
          "https://audiophile-media.t-bendet.com/products/xx59-headphones/intro-desktop.jpg",
        ariaLabel: "XX59 Headphones intro image",
        altText:
          "White headphones positioned on a white backdrop, showcasing their design.",
      },
      featuredImage: null,
      thumbnail: {
        src: "https://audiophile-media.t-bendet.com/products/xx59-headphones/thumbnail.jpg",
        ariaLabel: "XX59 Headphones thumbnail image",
        altText:
          "White headphones positioned on a white backdrop, showcasing their design - thumbnail.",
      },
      galleryImages: [
        {
          mobileSrc:
            "https://audiophile-media.t-bendet.com/products/xx59-headphones/gallery-1-mobile.jpg",
          tabletSrc:
            "https://audiophile-media.t-bendet.com/products/xx59-headphones/gallery-1-tablet.jpg",
          desktopSrc:
            "https://audiophile-media.t-bendet.com/products/xx59-headphones/gallery-1-desktop.jpg",
          ariaLabel: "XX59 Headphones gallery image 1",
          altText:
            "A woman wearing headphones, holding a cell phone, appears focused and engaged in her listening experience.",
        },
        {
          mobileSrc:
            "https://audiophile-media.t-bendet.com/products/xx59-headphones/gallery-2-mobile.jpg",
          tabletSrc:
            "https://audiophile-media.t-bendet.com/products/xx59-headphones/gallery-2-tablet.jpg",
          desktopSrc:
            "https://audiophile-media.t-bendet.com/products/xx59-headphones/gallery-2-desktop.jpg",
          ariaLabel: "XX59 Headphones gallery image 2",
          altText:
            " A stack of colorful books topped with a pair of black headphones, suggesting a blend of reading and listening.",
        },
        {
          mobileSrc:
            "https://audiophile-media.t-bendet.com/products/xx59-headphones/gallery-3-mobile.jpg",
          tabletSrc:
            "https://audiophile-media.t-bendet.com/products/xx59-headphones/gallery-3-tablet.jpg",
          desktopSrc:
            "https://audiophile-media.t-bendet.com/products/xx59-headphones/gallery-3-desktop.jpg",
          ariaLabel: "XX59 Headphones gallery image 3",
          altText:
            "A close-up of a hand gripping a white headphone, set against a smooth gray backdrop, highlighting the accessory's features.",
        },
      ],
      showCaseImage: null,
      relatedProductImage: {
        mobileSrc:
          "https://audiophile-media.t-bendet.com/products/xx59-headphones/related-mobile.jpg",
        tabletSrc:
          "https://audiophile-media.t-bendet.com/products/xx59-headphones/related-tablet.jpg",
        desktopSrc:
          "https://audiophile-media.t-bendet.com/products/xx59-headphones/related-desktop.jpg",
        ariaLabel: "XX59 Headphones related product image",
        altText:
          "White headphones positioned on a white backdrop, showcasing their design - related product.",
      },
    },
    featuredImageText: null,
  },
  {
    name: "xx99 mark one headphones",
    slug: "xx99-mark-one-headphones",
    shortLabel: "XX99 Mark I",
    cartLabel: "XX99 MK I",
    fullLabel: ["XX99 Mark I", "Headphones"],
    description:
      "As the gold standard for headphones, the classic XX99 Mark I offers detailed and accurate audio reproduction for audiophiles, mixing engineers, and music aficionados alike in studios and on the go.",
    price: 1750,
    isNewProduct: false,
    featuresText: [
      "As the headphones all others are measured against, the XX99 Mark I demonstrates over five decades of audio expertise, redefining the critical listening experience. This pair of closed-back headphones are made of industrial, aerospace-grade materials to emphasize durability at a relatively light weight of 11 oz.",
      "From the handcrafted microfiber ear cushions to the robust metal headband with inner damping element, the components work together to deliver comfort and uncompromising sound. Its closed-back design delivers up to 27 dB of passive noise cancellation, reducing resonance by reflecting sound to a dedicated absorber. For connectivity, a specially tuned cable is includes with a balanced gold connector.",
    ],
    includedItems: [
      {
        quantity: 1,
        item: "Headphone unit",
      },
      {
        quantity: 2,
        item: "Replacement earcups",
      },
      {
        quantity: 1,
        item: "User manual",
      },
      {
        quantity: 1,
        item: "3.5mm 5m audio cable",
      },
    ],
    images: {
      primaryImage: {
        mobileSrc:
          "https://audiophile-media.t-bendet.com/products/xx99-mark-one-headphones/primary-mobile.jpg",
        tabletSrc:
          "https://audiophile-media.t-bendet.com/products/xx99-mark-one-headphones/primary-tablet.jpg",
        desktopSrc:
          "https://audiophile-media.t-bendet.com/products/xx99-mark-one-headphones/primary-desktop.jpg",
        ariaLabel: "XX99 Mark I Headphones primary image",
        altText:
          "Stylish black and gold headphones positioned on a white background, emphasizing their elegant design and color scheme.",
      },
      introImage: {
        mobileSrc:
          "https://audiophile-media.t-bendet.com/products/xx99-mark-one-headphones/intro-mobile.jpg",
        tabletSrc:
          "https://audiophile-media.t-bendet.com/products/xx99-mark-one-headphones/intro-tablet.jpg",
        desktopSrc:
          "https://audiophile-media.t-bendet.com/products/xx99-mark-one-headphones/intro-desktop.jpg",
        ariaLabel: "XX99 Mark I Headphones intro image",
        altText:
          "Stylish black and gold headphones positioned on a white background, emphasizing their elegant design and color scheme.",
      },

      featuredImage: null,
      thumbnail: {
        src: "https://audiophile-media.t-bendet.com/products/xx99-mark-one-headphones/thumbnail.jpg",
        ariaLabel: "XX99 Mark I Headphones thumbnail image",
        altText:
          "Stylish black and gold headphones positioned on a white background, emphasizing their elegant design and color scheme. - thumbnail.",
      },
      galleryImages: [
        {
          mobileSrc:
            "https://audiophile-media.t-bendet.com/products/xx99-mark-one-headphones/gallery-1-mobile.jpg",
          tabletSrc:
            "https://audiophile-media.t-bendet.com/products/xx99-mark-one-headphones/gallery-1-tablet.jpg",
          desktopSrc:
            "https://audiophile-media.t-bendet.com/products/xx99-mark-one-headphones/gallery-1-desktop.jpg",
          ariaLabel: "XX99 Mark I Headphones gallery image 1",
          altText:
            "Black and white image featuring a microphone and headphones arranged together on a plain background.",
        },
        {
          mobileSrc:
            "https://audiophile-media.t-bendet.com/products/xx99-mark-one-headphones/gallery-2-mobile.jpg",
          tabletSrc:
            "https://audiophile-media.t-bendet.com/products/xx99-mark-one-headphones/gallery-2-tablet.jpg",
          desktopSrc:
            "https://audiophile-media.t-bendet.com/products/xx99-mark-one-headphones/gallery-2-desktop.jpg",
          ariaLabel: "XX99 Mark I Headphones gallery image 2",
          altText:
            "A pair of headphones, a stylish watch, and a trendy pair of sneakers arranged together on a flat surface.",
        },
        {
          mobileSrc:
            "https://audiophile-media.t-bendet.com/products/xx99-mark-one-headphones/gallery-3-mobile.jpg",
          tabletSrc:
            "https://audiophile-media.t-bendet.com/products/xx99-mark-one-headphones/gallery-3-tablet.jpg",
          desktopSrc:
            "https://audiophile-media.t-bendet.com/products/xx99-mark-one-headphones/gallery-3-desktop.jpg",
          ariaLabel: "XX99 Mark I Headphones gallery image 3",
          altText:
            "A monochrome image featuring a laptop and headphones placed together on a table.",
        },
      ],
      showCaseImage: null,
      relatedProductImage: {
        mobileSrc:
          "https://audiophile-media.t-bendet.com/products/xx99-mark-one-headphones/related-mobile.jpg",
        tabletSrc:
          "https://audiophile-media.t-bendet.com/products/xx99-mark-one-headphones/related-tablet.jpg",
        desktopSrc:
          "https://audiophile-media.t-bendet.com/products/xx99-mark-one-headphones/related-desktop.jpg",
        ariaLabel: "XX99 Mark I Headphones related product image",
        altText:
          "Stylish black and gold headphones positioned on a white background, emphasizing their elegant design and color scheme.",
      },
    },
    featuredImageText: null,
  },
  {
    name: "xx99 mark two headphones",
    slug: "xx99-mark-two-headphones",
    shortLabel: "XX99 Mark II",
    cartLabel: "XX99 MK II",
    fullLabel: ["XX99 Mark II", "Headphones"],
    description:
      "The new XX99 Mark II headphones is the pinnacle of pristine audio. It redefines your premium headphone experience by reproducing the balanced depth and precision of studio-quality sound.",
    price: 2999,
    isNewProduct: true,
    featuresText: [
      "Featuring a genuine leather head strap and premium earcups, these headphones deliver superior comfort for those who like to enjoy endless listening. It includes intuitive controls designed for any situation. Whether you’re taking a business call or just in your own personal space, the auto on/off and pause features ensure that you’ll never miss a beat.",
      "The advanced Active Noise Cancellation with built-in equalizer allow you to experience your audio world on your terms. It lets you enjoy your audio in peace, but quickly interact with your surroundings when you need to. Combined with Bluetooth 5. 0 compliant connectivity and 17 hour battery life, the XX99 Mark II headphones gives you superior sound, cutting-edge technology, and a modern design aesthetic.",
    ],
    includedItems: [
      {
        quantity: 1,
        item: "Headphone unit",
      },
      {
        quantity: 2,
        item: "Replacement earcups",
      },
      {
        quantity: 1,
        item: "User manual",
      },
      {
        quantity: 1,
        item: "3.5mm 5m audio cable",
      },
      {
        quantity: 1,
        item: "Travel bag",
      },
    ],
    images: {
      primaryImage: {
        mobileSrc:
          "https://audiophile-media.t-bendet.com/products/xx99-mark-two-headphones/primary-mobile.jpg",
        tabletSrc:
          "https://audiophile-media.t-bendet.com/products/xx99-mark-two-headphones/primary-tablet.jpg",
        desktopSrc:
          "https://audiophile-media.t-bendet.com/products/xx99-mark-two-headphones/intro-desktop.jpg",
        ariaLabel: "XX99 Mark II Headphones primary image",
        altText:
          "The XX99 Mark II wireless headphones are presented, emphasizing their contemporary design and high-quality audio features.",
      },
      introImage: {
        mobileSrc:
          "https://audiophile-media.t-bendet.com/products/xx99-mark-two-headphones/intro-mobile.jpg",
        tabletSrc:
          "https://audiophile-media.t-bendet.com/products/xx99-mark-two-headphones/intro-tablet.jpg",
        desktopSrc:
          "https://audiophile-media.t-bendet.com/products/xx99-mark-two-headphones/intro-desktop.jpg",
        ariaLabel: "XX99 Mark II Headphones intro image",
        altText:
          "The XX99 Mark II wireless headphones are presented, emphasizing their contemporary design and high-quality audio features.",
      },
      featuredImage: {
        mobileSrc:
          "https://audiophile-media.t-bendet.com/products/xx99-mark-two-headphones/featured-mobile.jpg",
        tabletSrc:
          "https://audiophile-media.t-bendet.com/products/xx99-mark-two-headphones/featured-tablet.jpg",
        desktopSrc:
          "https://audiophile-media.t-bendet.com/products/xx99-mark-two-headphones/featured-desktop.jpg",
        ariaLabel: "XX99 Mark II Headphones featured image",
        altText:
          "The XX99 Mark II wireless headphones are presented, emphasizing their contemporary design and high-quality audio features.",
      },
      thumbnail: {
        src: "https://audiophile-media.t-bendet.com/products/xx99-mark-two-headphones/thumbnail.jpg",
        ariaLabel: "XX99 Mark II Headphones thumbnail image",
        altText:
          "The XX99 Mark II wireless headphones are presented, emphasizing their contemporary design and high-quality audio features. - thumbnail.",
      },
      galleryImages: [
        {
          mobileSrc:
            "https://audiophile-media.t-bendet.com/products/xx99-mark-two-headphones/gallery-1-mobile.jpg",
          tabletSrc:
            "https://audiophile-media.t-bendet.com/products/xx99-mark-two-headphones/gallery-1-tablet.jpg",
          desktopSrc:
            "https://audiophile-media.t-bendet.com/products/xx99-mark-two-headphones/gallery-1-desktop.jpg",
          ariaLabel: "XX99 Mark II Headphones gallery image 1",
          altText:
            "Man wearing headphones, looking to the side, with geometric patterned wall in black and white.",
        },
        {
          mobileSrc:
            "https://audiophile-media.t-bendet.com/products/xx99-mark-two-headphones/gallery-2-mobile.jpg",
          tabletSrc:
            "https://audiophile-media.t-bendet.com/products/xx99-mark-two-headphones/gallery-2-tablet.jpg",
          desktopSrc:
            "https://audiophile-media.t-bendet.com/products/xx99-mark-two-headphones/gallery-2-desktop.jpg",
          ariaLabel: "XX99 Mark II Headphones gallery image 2",
          altText:
            "A person at a table, wearing headphones and looking at their phone, suggests a blend of relaxation and digital engagement.",
        },
        {
          mobileSrc:
            "https://audiophile-media.t-bendet.com/products/xx99-mark-two-headphones/gallery-3-mobile.jpg",
          tabletSrc:
            "https://audiophile-media.t-bendet.com/products/xx99-mark-two-headphones/gallery-3-tablet.jpg",
          desktopSrc:
            "https://audiophile-media.t-bendet.com/products/xx99-mark-two-headphones/gallery-3-desktop.jpg",
          ariaLabel: "XX99 Mark II Headphones gallery image 3",
          altText:
            "A close-up view of black and white headphones resting on a flat surface.",
        },
      ],
      relatedProductImage: {
        mobileSrc:
          "https://audiophile-media.t-bendet.com/products/xx99-mark-two-headphones/related-mobile.jpg",
        tabletSrc:
          "https://audiophile-media.t-bendet.com/products/xx99-mark-two-headphones/related-tablet.jpg",
        desktopSrc:
          "https://audiophile-media.t-bendet.com/products/xx99-mark-two-headphones/related-desktop.jpg",
        ariaLabel: "XX99 Mark II Headphones related product image",
        altText:
          "The XX99 Mark II wireless headphones are presented, emphasizing their contemporary design and high-quality audio features.",
      },

      showCaseImage: null,
    },
    featuredImageText:
      "Experience natural, lifelike audio and exceptional build quality made for the passionate music enthusiast.",
  },
];

export const earphonesProductData: ProductCreateWithoutCategoryInput[] = [
  {
    name: "yx1 wireless earphones",
    slug: "yx1-wireless-earphones",
    shortLabel: "YX1 Earphones",
    cartLabel: "YX1",
    fullLabel: ["YX1 Wireless", "Earphones"],
    description:
      "Tailor your listening experience with bespoke dynamic drivers from the new YX1 Wireless Earphones. Enjoy incredible high-fidelity sound even in noisy environments with its active noise cancellation feature.",
    price: 599,
    isNewProduct: true,
    featuresText: [
      "Experience unrivalled stereo sound thanks to innovative acoustic technology. With improved ergonomics designed for full day wearing, these revolutionary earphones have been finely crafted to provide you with the perfect fit, delivering complete comfort all day long while enjoying exceptional noise isolation and truly immersive sound.",
      "The YX1 Wireless Earphones features customizable controls for volume, music, calls, and voice assistants built into both earbuds. The new 7-hour battery life can be extended up to 28 hours with the charging case, giving you uninterrupted play time. Exquisite craftsmanship with a splash resistant design now available in an all new white and grey color scheme as well as the popular classic black.",
    ],
    includedItems: [
      {
        quantity: 2,
        item: "Earphone unit",
      },
      {
        quantity: 6,
        item: "Multi-size earplugs",
      },
      {
        quantity: 1,
        item: "User manual",
      },
      {
        quantity: 1,
        item: "USB-C charging cable",
      },
      {
        quantity: 1,
        item: "Travel pouch",
      },
    ],
    images: {
      primaryImage: {
        mobileSrc:
          "https://audiophile-media.t-bendet.com/products/yx1-wireless-earphones/primary-mobile.jpg",
        tabletSrc:
          "https://audiophile-media.t-bendet.com/products/yx1-wireless-earphones/primary-tablet.jpg",
        desktopSrc:
          "https://audiophile-media.t-bendet.com/products/yx1-wireless-earphones/primary-desktop.jpg",
        ariaLabel: "YX1 Wireless Earphones product image",
        altText:
          "A smooth, dark gray spherical object with a subtle groove and a small geometric logo at the center, floating against a light gray background.",
      },
      introImage: {
        mobileSrc:
          "https://audiophile-media.t-bendet.com/products/yx1-wireless-earphones/intro-mobile.jpg",
        tabletSrc:
          "https://audiophile-media.t-bendet.com/products/yx1-wireless-earphones/intro-tablet.jpg",
        desktopSrc:
          "https://audiophile-media.t-bendet.com/products/yx1-wireless-earphones/intro-desktop.jpg",
        ariaLabel: "YX1 Wireless Earphones product image",
        altText:
          "A smooth, dark gray spherical object with a subtle groove and a small geometric logo at the center, floating against a light gray background.",
      },
      featuredImage: null,
      thumbnail: {
        src: "https://audiophile-media.t-bendet.com/products/yx1-wireless-earphones/thumbnail.jpg",
        ariaLabel: "YX1 Wireless Earphones thumbnail image",
        altText:
          "A smooth, dark gray spherical object with a subtle groove and a small geometric logo at the center, floating against a light gray background - thumbnail.",
      },
      galleryImages: [
        {
          mobileSrc:
            "https://audiophile-media.t-bendet.com/products/yx1-wireless-earphones/gallery-1-mobile.jpg",
          tabletSrc:
            "https://audiophile-media.t-bendet.com/products/yx1-wireless-earphones/gallery-1-tablet.jpg",
          desktopSrc:
            "https://audiophile-media.t-bendet.com/products/yx1-wireless-earphones/gallery-1-desktop.jpg",
          ariaLabel: "YX1 Wireless Earphones gallery image 1",
          altText:
            "Close-up view of the YX1 Wireless Earphones resting on a textured surface, highlighting their sleek and modern design.",
        },
        {
          mobileSrc:
            "https://audiophile-media.t-bendet.com/products/yx1-wireless-earphones/gallery-2-mobile.jpg",
          tabletSrc:
            "https://audiophile-media.t-bendet.com/products/yx1-wireless-earphones/gallery-2-tablet.jpg",
          desktopSrc:
            "https://audiophile-media.t-bendet.com/products/yx1-wireless-earphones/gallery-2-desktop.jpg",
          ariaLabel: "YX1 Wireless Earphones gallery image 2",
          altText:
            "YX1 Wireless Earphones displayed on a clean, modern surface, emphasizing their compact and ergonomic design.",
        },
        {
          mobileSrc:
            "https://audiophile-media.t-bendet.com/products/yx1-wireless-earphones/gallery-3-mobile.jpg",
          tabletSrc:
            "https://audiophile-media.t-bendet.com/products/yx1-wireless-earphones/gallery-3-tablet.jpg",
          desktopSrc:
            "https://audiophile-media.t-bendet.com/products/yx1-wireless-earphones/gallery-3-desktop.jpg",
          ariaLabel: "YX1 Wireless Earphones gallery image 3",
          altText:
            "YX1 Wireless Earphones placed on a textured surface, showcasing their sleek and modern design from a unique angle.",
        },
      ],
      showCaseImage: {
        mobileSrc:
          "https://audiophile-media.t-bendet.com/products/yx1-wireless-earphones/showcase-mobile.jpg",
        tabletSrc:
          "https://audiophile-media.t-bendet.com/products/yx1-wireless-earphones/showcase-tablet.jpg",
        desktopSrc:
          "https://audiophile-media.t-bendet.com/products/yx1-wireless-earphones/showcase-desktop.jpg",
        ariaLabel: "YX1 Wireless Earphones showcase image",
        altText:
          "YX1 Wireless Earphones displayed prominently on a clean surface, highlighting their sleek and modern design.",
      },
      relatedProductImage: {
        mobileSrc:
          "https://audiophile-media.t-bendet.com/products/yx1-wireless-earphones/related-mobile.jpg",
        tabletSrc:
          "https://audiophile-media.t-bendet.com/products/yx1-wireless-earphones/related-tablet.jpg",
        desktopSrc:
          "https://audiophile-media.t-bendet.com/products/yx1-wireless-earphones/related-desktop.jpg",
        ariaLabel: "YX1 Earphones related product image",
        altText:
          "A smooth, dark gray spherical object with a subtle groove and a small geometric logo at the center, floating against a light gray background - related product.",
      },
    },
    featuredImageText: null,
  },
];

export const speakersProductData: ProductCreateWithoutCategoryInput[] = [
  {
    name: "zx7 speaker",
    slug: "zx7-speaker",
    shortLabel: "ZX7 Speaker",
    cartLabel: "ZX7",
    fullLabel: ["ZX7", "Speaker"],
    description:
      "Stream high quality sound wirelessly with minimal to no loss. The ZX7 speaker uses high-end audiophile components that represents the top of the line powered speakers for home or studio use.",
    price: 3500,
    isNewProduct: false,
    featuresText: [
      "Reap the advantages of a flat diaphragm tweeter cone. This provides a fast response rate and excellent high frequencies that lower tiered bookshelf speakers cannot provide. The woofers are made from aluminum that produces a unique and clear sound. XLR inputs allow you to connect to a mixer for more advanced usage.",
      "The ZX7 speaker is the perfect blend of stylish design and high performance. It houses an encased MDF wooden enclosure which minimises acoustic resonance. Dual connectivity allows pairing through bluetooth or traditional optical and RCA input. Switch input sources and control volume at your finger tips with the included wireless remote. This versatile speaker is equipped to deliver an authentic listening experience.",
    ],
    includedItems: [
      {
        quantity: 2,
        item: "Speaker unit",
      },
      {
        quantity: 2,
        item: "Speaker cloth panel",
      },
      {
        quantity: 1,
        item: "User manual",
      },
      {
        quantity: 1,
        item: "3.5mm 7.5m audio cable",
      },
      {
        quantity: 1,
        item: "7.5m optical cable",
      },
    ],
    images: {
      primaryImage: {
        mobileSrc:
          "https://audiophile-media.t-bendet.com/products/zx7-speaker/primary-mobile.jpg",
        tabletSrc:
          "https://audiophile-media.t-bendet.com/products/zx7-speaker/primary-tablet.jpg",
        desktopSrc:
          "https://audiophile-media.t-bendet.com/products/zx7-speaker/primary-desktop.jpg",
        ariaLabel: "ZX7 Speaker primary image",
        altText: "A sleek black speaker displayed on a clean white background.",
      },
      introImage: {
        mobileSrc:
          "https://audiophile-media.t-bendet.com/products/zx7-speaker/intro-mobile.jpg",
        tabletSrc:
          "https://audiophile-media.t-bendet.com/products/zx7-speaker/intro-tablet.jpg",
        desktopSrc:
          "https://audiophile-media.t-bendet.com/products/zx7-speaker/intro-desktop.jpg",
        ariaLabel: "ZX7 Speaker intro image",
        altText: "A sleek black speaker displayed on a clean white background.",
      },
      featuredImage: null,
      thumbnail: {
        src: "https://audiophile-media.t-bendet.com/products/zx7-speaker/thumbnail.jpg",
        ariaLabel: "ZX7 Speaker thumbnail image",
        altText:
          "A sleek black speaker displayed on a clean white background - thumbnail.",
      },
      galleryImages: [
        {
          mobileSrc:
            "https://audiophile-media.t-bendet.com/products/zx7-speaker/gallery-1-mobile.jpg",
          tabletSrc:
            "https://audiophile-media.t-bendet.com/products/zx7-speaker/gallery-1-tablet.jpg",
          desktopSrc:
            "https://audiophile-media.t-bendet.com/products/zx7-speaker/gallery-1-desktop.jpg",
          ariaLabel: "ZX7 Speaker gallery image 1",
          altText:
            "Detailed view of a speaker set against a black background, emphasizing its features and craftsmanship.",
        },
        {
          mobileSrc:
            "https://audiophile-media.t-bendet.com/products/zx7-speaker/gallery-2-mobile.jpg",
          tabletSrc:
            "https://audiophile-media.t-bendet.com/products/zx7-speaker/gallery-2-tablet.jpg",
          desktopSrc:
            "https://audiophile-media.t-bendet.com/products/zx7-speaker/gallery-2-desktop.jpg",
          ariaLabel: "ZX7 Speaker gallery image 2",
          altText:
            "A man working at a desk with two screens and a keyboard, engaged in his tasks.",
        },
        {
          mobileSrc:
            "https://audiophile-media.t-bendet.com/products/zx7-speaker/gallery-3-mobile.jpg",
          tabletSrc:
            "https://audiophile-media.t-bendet.com/products/zx7-speaker/gallery-3-tablet.jpg",
          desktopSrc:
            "https://audiophile-media.t-bendet.com/products/zx7-speaker/gallery-3-desktop.jpg",
          ariaLabel: "ZX7 Speaker gallery image 3",
          altText:
            "A black speaker placed on a table against a clean white background.",
        },
      ],
      showCaseImage: {
        mobileSrc:
          "https://audiophile-media.t-bendet.com/products/zx7-speaker/showcase-mobile.jpg",
        tabletSrc:
          "https://audiophile-media.t-bendet.com/products/zx7-speaker/showcase-tablet.jpg",
        desktopSrc:
          "https://audiophile-media.t-bendet.com/products/zx7-speaker/showcase-desktop.jpg",
        ariaLabel: "ZX7 Speaker showcase image",
        altText:
          "A monochrome image featuring a speaker resting on a table, emphasizing its shape and surroundings.",
      },
      relatedProductImage: {
        mobileSrc:
          "https://audiophile-media.t-bendet.com/products/zx7-speaker/related-mobile.jpg",
        tabletSrc:
          "https://audiophile-media.t-bendet.com/products/zx7-speaker/related-tablet.jpg",
        desktopSrc:
          "https://audiophile-media.t-bendet.com/products/zx7-speaker/related-desktop.jpg",
        ariaLabel: "ZX7 Speaker suggested product image",
        altText:
          "A sleek black speaker displayed on a clean white background - related product.",
      },
    },
    featuredImageText: null,
  },
  {
    name: "zx9 speaker",
    slug: "zx9-speaker",
    shortLabel: "ZX9 Speaker",
    cartLabel: "ZX9",
    fullLabel: ["ZX9", "Speaker"],
    description:
      "Upgrade your sound system with the all new ZX9 active speaker. It’s a bookshelf speaker system that offers truly wireless connectivity -- creating new possibilities for more pleasing and practical audio setups.",
    price: 4500,
    isNewProduct: true,
    featuresText: [
      "Connect via Bluetooth or nearly any wired source. This speaker features optical, digital coaxial, USB Type-B, stereo RCA, and stereo XLR inputs, allowing you to have up to five wired source devices connected for easy switching. Improved bluetooth technology offers near lossless audio quality at up to 328ft (100m).",
      "Discover clear, more natural sounding highs than the competition with ZX9’s signature planar diaphragm tweeter. Equally important is its powerful room-shaking bass courtesy of a 6.5” aluminum alloy bass unit. You’ll be able to enjoy equal sound quality whether in a large room or small den. Furthermore, you will experience new sensations from old songs since it can respond to even the subtle waveforms.",
    ],
    includedItems: [
      {
        quantity: 2,
        item: "Speaker unit",
      },
      {
        quantity: 2,
        item: "Speaker cloth panel",
      },
      {
        quantity: 1,
        item: "User manual",
      },
      {
        quantity: 1,
        item: "3.5mm 10m audio cable",
      },
      {
        quantity: 1,
        item: "10m optical cable",
      },
    ],
    images: {
      primaryImage: {
        mobileSrc:
          "https://audiophile-media.t-bendet.com/products/zx9-speaker/primary-mobile.jpg",
        tabletSrc:
          "https://audiophile-media.t-bendet.com/products/zx9-speaker/primary-tablet.jpg",
        desktopSrc:
          "https://audiophile-media.t-bendet.com/products/zx9-speaker/primary-desktop.jpg",
        ariaLabel: "ZX9 Speaker primary image",
        altText:
          "A stylish black speaker topped with a white dome, emphasizing a minimalist design approach.",
      },
      introImage: {
        mobileSrc:
          "https://audiophile-media.t-bendet.com/products/zx9-speaker/intro-mobile.jpg",
        tabletSrc:
          "https://audiophile-media.t-bendet.com/products/zx9-speaker/intro-tablet.jpg",
        desktopSrc:
          "https://audiophile-media.t-bendet.com/products/zx9-speaker/intro-desktop.jpg",
        ariaLabel: "ZX9 Speaker intro image",
        altText:
          "A stylish black speaker topped with a white dome, emphasizing a minimalist design approach.",
      },
      featuredImage: null,
      thumbnail: {
        src: "https://audiophile-media.t-bendet.com/products/zx9-speaker/thumbnail.jpg",
        ariaLabel: "ZX9 Speaker thumbnail image",
        altText:
          "A stylish black speaker topped with a white dome, emphasizing a minimalist design approach. - thumbnail.",
      },
      galleryImages: [
        {
          mobileSrc:
            "https://audiophile-media.t-bendet.com/products/zx9-speaker/gallery-1-mobile.jpg",
          tabletSrc:
            "https://audiophile-media.t-bendet.com/products/zx9-speaker/gallery-1-tablet.jpg",
          desktopSrc:
            "https://audiophile-media.t-bendet.com/products/zx9-speaker/gallery-1-desktop.jpg",
          ariaLabel: "ZX9 Speaker gallery image 1",
          altText:
            " A black speaker with a contrasting white dome on top, highlighting its contemporary aesthetic.",
        },
        {
          mobileSrc:
            "https://audiophile-media.t-bendet.com/products/zx9-speaker/gallery-2-mobile.jpg",
          tabletSrc:
            "https://audiophile-media.t-bendet.com/products/zx9-speaker/gallery-2-tablet.jpg",
          desktopSrc:
            "https://audiophile-media.t-bendet.com/products/zx9-speaker/gallery-2-desktop.jpg",
          ariaLabel: "ZX9 Speaker gallery image 2",
          altText:
            "A monochrome image of a room showcasing a classic stereo system on a shelf, with minimalistic decor surrounding it.",
        },
        {
          mobileSrc:
            "https://audiophile-media.t-bendet.com/products/zx9-speaker/gallery-3-mobile.jpg",
          tabletSrc:
            "https://audiophile-media.t-bendet.com/products/zx9-speaker/gallery-3-tablet.jpg",
          desktopSrc:
            "https://audiophile-media.t-bendet.com/products/zx9-speaker/gallery-3-desktop.jpg",
          ariaLabel: "ZX9 Speaker gallery image 3",
          altText:
            " Two speakers with contrasting white and black covers positioned side by side on a surface.",
        },
      ],
      showCaseImage: {
        mobileSrc:
          "https://audiophile-media.t-bendet.com/products/zx9-speaker/showcase-mobile.png",
        tabletSrc:
          "https://audiophile-media.t-bendet.com/products/zx9-speaker/showcase-tablet.png",
        desktopSrc:
          "https://audiophile-media.t-bendet.com/products/zx9-speaker/showcase-desktop.png",
        ariaLabel: "ZX9 Speaker showcase image",
        altText:
          "A stylish black speaker topped with a white dome, emphasizing a minimalist design approach.",
      },
      relatedProductImage: {
        mobileSrc:
          "https://audiophile-media.t-bendet.com/products/zx9-speaker/related-mobile.jpg",
        tabletSrc:
          "https://audiophile-media.t-bendet.com/products/zx9-speaker/related-tablet.jpg",
        desktopSrc:
          "https://audiophile-media.t-bendet.com/products/zx9-speaker/related-desktop.jpg",
        ariaLabel: "ZX9 Speaker related product image",
        altText:
          "A stylish black speaker topped with a white dome, emphasizing a minimalist design approach. - suggested product.",
      },
    },
    featuredImageText: null,
    showCaseImageText:
      "Upgrade to premium speakers that are phenomenally built to deliver truly remarkable sound.",
  },
];

const seedProductsData = async (
  productsData: ProductCreateWithoutCategoryInput[],
  createdCategoriesMap: Record<CategoryName, string>,
  categoryName: CategoryName,
) => {
  console.log(`***********${categoryName}***********`);

  const createdProductsByCategory: ProductCreateResult[] = [];
  for (const product of productsData) {
    const createdProduct = await prisma.product.create({
      data: {
        ...product,
        category: {
          connect: {
            id: createdCategoriesMap[categoryName],
          },
        },
      },
    });
    createdProductsByCategory.push(createdProduct);
    console.log(`Created product with id: ${createdProduct.id}`);
  }
  return createdProductsByCategory;
};

const seedProducts = async (createdCategories: ReadOutput[]) => {
  console.log(`Start seeding products...`);

  const createdProducts: ProductCreateResult[] = [];

  const createdCategoriesMap = createdCategories.reduce(
    (acc, category) => {
      acc[category.name] = category.id;
      return acc;
    },
    {} as Record<CategoryName, string>,
  );

  const createdHeadphones = await seedProductsData(
    headphonesProductData,
    createdCategoriesMap,
    "Headphones",
  );

  const createdEarphones = await seedProductsData(
    earphonesProductData,
    createdCategoriesMap,
    "Earphones",
  );
  const createdSpeakers = await seedProductsData(
    speakersProductData,
    createdCategoriesMap,
    "Speakers",
  );

  createdProducts.push(
    ...createdHeadphones,
    ...createdEarphones,
    ...createdSpeakers,
  );

  console.log(`Finished seeding products...`);

  return createdProducts;
};

export default seedProducts;
