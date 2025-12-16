import FacebookLogo from "@/assets/icon-facebook.svg?react";
import InstagramLogo from "@/assets/icon-instagram.svg?react";
import TwitterLogo from "@/assets/icon-twitter.svg?react";
import Logo from "@/assets/logo.svg?react";
import { Container } from "@/components/ui/container";
import { Link } from "react-router-dom";
import { NavLinks } from "@/components/layouts/nav-links";
import { paths } from "@/config/paths";

export const Footer = () => {
  return (
    <footer className="relative mt-auto bg-neutral-900 text-center">
      <Container classes="before:bg-primary-500 grid gap-y-12 pt-14 pb-10 before:absolute before:top-[1px] before:h-1 before:w-28 before:justify-self-center before:content-[''] md:grid-cols-2 md:gap-y-8 md:text-left md:before:justify-self-start">
        <Link
          className="hover:*:*:fill-primary-500 focus-visible:*:*:fill-primary-500 max-md:mx-auto md:col-span-2 lg:col-span-1"
          to={paths.home.path}
        >
          <Logo title="audiophile logo" />
        </Link>
        <NavLinks />
        <p className="opacity-50 max-md:max-w-96 max-md:place-self-center md:col-span-2 md:max-lg:max-w-[680px] lg:col-span-1">
          Audiophile is an all in one stop to fulfill your audio needs. We're a
          small team of music lovers and sound specialists who are devoted to
          helping you get the most out of personal audio. Come and visit our
          demo facility - we’re open 7 days a week.
        </p>
        <p className="col-span-1 col-start-1 font-bold opacity-50 md:max-lg:mt-12 lg:mt-14">
          Copyright 2021. All Rights Reserved
        </p>
        <div className="col-span-1 flex items-end justify-center gap-4 md:justify-end md:max-lg:mt-12 lg:col-start-2 lg:row-start-2">
          <a
            href="https://facebook.com"
            target="_blank "
            className="hover:*:*:fill-primary-500 focus-visible:*:*:fill-primary-500"
          >
            <FacebookLogo title="facebook logo" />
          </a>
          <a
            href="https://twitter.com"
            target="_blank"
            className="hover:*:*:fill-primary-500 focus-visible:*:*:fill-primary-500"
          >
            <TwitterLogo className="" title="twitter logo" />
          </a>
          <a
            href="https://instagram.com"
            target="_blank"
            className="hover:*:*:fill-primary-500 focus-visible:*:*:fill-primary-500"
          >
            <InstagramLogo className="" title="instagram logo" />
          </a>
        </div>
      </Container>
    </footer>
  );
};
