<template>
  <div class="tab-mobile-column">
    <div class="section section-history">
      <h1 class="heading">Our History</h1>
      <p class="text">
        For over 40 years, the Montouris family has been dedicated to the timeless craft
        of beekeeping, producing some of the finest honey in Greece. Today, we proudly
        continue this rich tradition, with Antonios Montouris at the helm, steering the
        course towards an even sweeter future.
      </p>
    </div>
    <div class="section section-boxes-vertical">
      <img
        class="floating-image tradition"
        src="@/assets/pages/history/mobile/tradition.png"
      />
      <!-- <h2 class="floating-heading">
        A Tradition of
        <br/>
        Excellence
      </h2> -->
      <img :src="gridImage1" class="image boxes-vertical" alt="honey boxes" />
      <p class="text">
        It all began four decades ago, when the Montouris family established their honey
        business. What started as a humble endeavor grew into a labor of love and a
        testament to unwavering commitment.
      </p>
    </div>
    <div class="section section-boxes-horizontal">
      <img :src="image1" class="image boxes-horizontal" alt="honey boxes" />
      <p class="text">
        When Antonios Montouris took the reins after his father's passing, he didn't just
        inherit a business; he inherited a legacy. His vision was clear – to expand, to
        innovate, and to share the exquisite honey from their hives with the world.
      </p>
    </div>
    <div class="section section-beekeeper">
      <img
        class="floating-image journey"
        src="@/assets/pages/history/mobile/journey.png"
      />
      <!-- <span class="floating-heading">
        Our journey
        <br/>of honey
      </span> -->
      <img :src="image2" class="image beekeeper" alt="beekeeper" />
      <img src="@/assets/pages/history/mobile/journey-quote.svg" class="quote beekeper" />
    </div>
    <div class="section section-journey">
      <!-- <span class="quote-container">
          <img class="quote quote-start" :src="quoteStart"/>
          <span class="text-between-quotes">
            Our journey began with a simple premise
          </span>
          <img class="quote quote-end" :src="quoteEnd"/>
        </span> -->
      <p class="text">
        Direct sales from our premises. The sheer quality of our honey garnered attention,
        and it was soon recognized as a benchmark for excellence. The demand for our
        golden nectar inspired us to diversify our offerings.
      </p>
      <img
        class="floating-image hellenic"
        src="@/assets/pages/history/mobile/hellenic.png"
      />
      <!-- <span class="floating-heading">
          Hellenic
          <br/>premium
          <br/>honey
        </span> -->
    </div>
    <div class="section section-brands">
      <span class="heading"
        >Today, we are proud to introduce three distinct product series</span
      >
      <img class="floating-image honey" src="@/assets/pages/history/mobile/honey.png" />
      <!-- <h2 class="floating-heading">
        honey
        <br/>
        product
        <br/>
        series
      </h2> -->
      <div class="haa-container row">
        <img class="logo" :src="haa" alt="honey apiary academy" />
        <span class="description">
          The epitome of honey perfection, this series offers the purest, most exquisite
          honey nature has to offer. Our bees roam pristine Greek landscapes, collecting
          nectar from a rich tapestry of flowers, resulting in a honey that is
          unparalleled in quality.
        </span>
      </div>
      <div class="okto-container row">
        <img class="logo" :src="okto" alt="okto" />
        <span class="description">
          For those who seek the best, our Premium Honey series combines the rich flavors
          of the Greek countryside with a touch of tradition. This is honey that carries a
          piece of our heritage in every drop.
        </span>
      </div>
      <div class="melculum-container row">
        <img class="logo" :src="melculum" alt="melculum" />
        <span class="description">
          Our honey spreads and other delightful creations are a testament to our
          creativity and passion. Here, we blend the beauty of diversity with the art of
          taste, crafting unique and delicious honey-based products that you'll love.
        </span>
      </div>
    </div>
    <!-- <div class="background-container">
    </div> -->
    <div class="section section-greece">
      <img class="image greece" :src="background" alt="greece" />
      <!-- <h2 class="floating-heading">Greece</h2> -->
      <img class="greece" src="@/assets/pages/history/mobile/greece.svg" />

      <img
        class="quote beloved-home"
        src="@/assets/pages/history/mobile/our-beloved-home.svg"
      />
      <!-- <div class="quote-container">
          <img class="quote quote-start" :src="quoteStart"/>
          <span class="text-between-quotes">
            our beloved home
          </span>
          <img class="quote quote-end" :src="quoteEnd"/>
      </div> -->
    </div>
    <div class="section section-description">
      <img
        class="floating-image antonios"
        src="@/assets/pages/history/mobile/antonios.png"
      />
      <!-- <h2 class="floating-heading">
        Antonios Montouris Honey
      </h2> -->
      <p class="text">
        A long-standing tradition of producing high-quality honey with an intense aroma.
        From the blossoms of the Peloponnesian orchards to the wild herbs of Crete, our
        bees are nature's gifted artisans, capturing the essence of the Greek landscape in
        every jar.
        <br />
        <br />
        As we celebrate our heritage and our honey's journey from our hives to your homes,
        we invite you to savor the magic of honey in all its glory. Not only is honey a
        delectable natural sweetener, but it also offers a plethora of health benefits.
        Packed with antioxidants, vitamins, and minerals, honey is a true elixir of
        wellness, enhancing both the palate and the body.
      </p>
    </div>
    <div class="section section-quote">
      <!-- <p class="quote-container">
          <img class="quote quote-start" :src="quoteStart"/>
          <span class="text-between-quotes">
            where tradition, innovation, 
            <br/>
            and the purest honey meet
          </span>
          <img class="quote quote-end" :src="quoteEnd"/>
        </p> -->
      <img class="quote tradition" src="@/assets/pages/history/mobile/tradition.svg" />
    </div>
    <div class="section section-cta">
      <router-link :to="'/products'" class="cta"
        >Discover the range of honey products
      </router-link>
    </div>
  </div>
</template>

<script>
export default {
  name: "TabMobile",
  phases: 3, // 0 indexed
};
</script>
<script setup>
import { ref, watch, onMounted, nextTick, toRaw } from "vue";
import { useWindowSize } from "@vueuse/core";

import gridImage1 from "@/assets/pages/history/boxes-vertical-mobile.png";
import image1 from "@/assets/pages/history/boxes-horizontal-mobile.png";
import image2 from "@/assets/pages/history/beekeeper-mobile.png";
import okto from "@/assets/pages/history/okto.png";
import haa from "@/assets/pages/history/haa.png";
import melculum from "@/assets/pages/history/melculum.png";
import quoteStart from "@/assets/pages/history/quote-start.png";
import quoteEnd from "@/assets/pages/history/quote-end.png";
import background from "@/assets/pages/history/greece-mobile.png";
</script>

<style lang="scss" scoped>
.tab-mobile-column {
  display: flex !important;
  flex-direction: column;
  background-color: white;
  overflow-x: hidden !important;
  align-items: center;
  .floating-heading {
    // position: absolute;
    font-family: "DMSans";
    font-size: 75px;
    font-weight: 700;
    line-height: 61.25px;
    letter-spacing: 0.06em;
    text-align: right;
    text-transform: uppercase;
    // white-space: nowrap;
    color: #f0f4f5;
    display: flex;
    margin: 0px;
    writing-mode: vertical-rl;
    transform: rotate(180deg);
    position: absolute;
    // left: 10%;
    z-index: 1;
    @media (max-width: 380px) {
      font-size: 65px;
    }
  }
  .floating-image {
    position: absolute;
  }
  .heading {
    font-family: "DM Serif";
    font-size: 32px;
    font-weight: 400;
    text-align: left;
    color: #000000;
    z-index: 2;
  }
  .text {
    font-family: "DMSans";
    font-size: 13px;
    font-weight: 400;
    line-height: 22px;
    text-align: center;
    color: #000000;
    z-index: 2;
  }

  .quote-container {
    width: 100%;
    z-index: 2;
    .text-between-quotes {
      font-family: "Alex Brush";
      font-size: 32px;
      font-weight: 400;
      line-height: 40px;
      text-align: center;
      color: #000000;
    }
    .quote {
      font-family: "AbyssinicaSIL";
      font-size: 40px;
      font-weight: 400;
      line-height: 50px;
      text-align: center;
      width: 25px;
    }
  }
  .image {
    max-width: 100%;
    z-index: 2;
  }
  .section {
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: 100%;
    margin-bottom: 30px !important;
    // border-bottom: 1px solid gray;
    position: relative;
    background-color: white;
    width: 90% !important;
    // overflow: hidden !important;

    &-history {
      width: 85%;
      margin: auto;
      margin-top: 80px;
      .text {
        text-align: left !important;
        width: 80%;
      }
    }

    &-boxes-vertical {
      width: 85%;
      margin: auto;
      // padding-right: 1%;
      margin-bottom: 120px !important;
      position: relative;
      .image {
        width: 81%;
        align-self: flex-end;
        // margin-right: -10px;
      }
      .floating-heading {
        white-space: nowrap;
        z-index: 3;
      }
      .floating-image {
        z-index: 10;
        width: 33%;
      }
      .text {
        width: 60%;
        align-self: flex-end;
        text-align: left;
        margin-top: 30px;
      }
    }

    &-boxes-horizontal {
      .image {
        width: 100%;
        height: auto;
        align-self: center;
      }
      .text {
        width: 90%;
        text-align: center;
        align-self: center;
      }
    }

    &-beekeeper {
      margin-bottom: 55px !important;
      position: relative;
      .floating-heading {
        z-index: 3;
        font-size: 65px;
      }
      .floating-image {
        width: 40%;
        z-index: 10;
        left: -4%;
      }
      .image {
        width: 81%;
        align-self: flex-end;
        // margin-left: 35px;
      }
      .floating-heading {
        white-space: nowrap;
      }
      .quote {
        z-index: 11;
        width: 90%;
        margin-right: -5%;
        align-self: flex-end;
      }
    }

    &-journey {
      margin-bottom: 60px !important;
      height: 350px !important;
      position: relative;
      .floating-heading {
        right: 0;
        top: -30px;
      }
      .floating-image {
        width: 55%;
        // height: 100%;
        right: 0;
        top: 30%;
        z-index: 1;
      }
      .text {
        margin-top: 0px;
        font-family: "DMSans";
        font-weight: 400;
        font-size: 13px;
        line-height: 22px;
        letter-spacing: 0%;
        text-align: center;
      }
    }

    &-brands {
      position: relative;
      margin-bottom: 0px !important;
      .heading {
        font-style: italic;
        font-size: 16px;
        width: 70%;
        margin: auto;
        text-align: center;
        margin-bottom: 50px;
      }
      .floating-heading {
        text-align: right;
        font-size: 80px;
        letter-spacing: 0.1em;
        bottom: 28%;
        @media (max-width: 380px) {
          font-size: 70px;
        }
      }
      .floating-image {
        width: 55%;
        z-index: 1;
        top: 30%;
        transform: translateY(-40%);
      }
      .row {
        display: flex;
        flex-direction: column;
        margin-bottom: 90px;
        padding: 0 5% 0 5%;
        z-index: 2;
        .logo {
          width: 50%;
          margin-bottom: 25px;
        }
        .description {
          font-family: "DMSans";
          font-size: 13px;
          font-weight: 400;
          line-height: 22px;
          color: black;
        }
        &.haa-container {
          .logo {
            align-self: center;
          }
          .description {
            text-align: center;
          }
        }
        &.okto-container {
          .logo {
            align-self: center;
          }
          .description {
            text-align: center;
          }
        }
        &.melculum-container {
          margin-bottom: 35px;
          .logo {
            align-self: center;
          }
          .description {
            text-align: center;
          }
        }
      }
    }

    &-greece {
      position: relative;
      .image {
        width: 100%;
        margin: auto;
        margin-bottom: 45px;
        display: none;
      }
      .floating-heading {
        right: -20px;
        z-index: 3;
      }
      .quote-container {
        display: flex;
        // min-height: 120px;
        justify-content: center;
        margin-bottom: 50px;
        margin-left: -20px;
        .quote-start {
          align-self: flex-start;
        }
        .quote-end {
          align-self: flex-end;
        }
        .text-between-quotes {
          text-transform: capitalize;
          margin: 5px 10px 5px 10px;
        }
      }
      .quote {
        margin-top: 30px;
        margin-bottom: 10px;
      }
    }
    &-description {
      position: relative;
      .text {
        width: 85%;
        margin: auto;
      }
      .floating-heading {
        top: 30%;
        text-align: left;
      }
      .floating-image {
        width: 60%;
        z-index: 1;
        left: 0%;
        top: 15%;
      }
    }
    &-quote {
      min-height: 220px;
      justify-content: flex-end;
      @media (min-height: 850px) {
        margin-bottom: 50px !important;
      }
      .quote {
        z-index: 10;
      }
    }

    &-cta {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 0px !important;
      min-height: 80px;
      background: #f2f2f2;
      .cta {
        font-family: "DMSans";
        font-size: 14px;
        font-weight: 500;
        text-align: center;
        color: black;
        text-transform: uppercase;
      }
    }
  }
}
</style>
