import { Github } from "lucide-react";
import Link from "next/link";
import React from "react";

export const Footer = () => {
  return (
    <section className="flex flex-row">
      <Link
        href={"https://github.com/notquarks/temp-vault"}
        className="flex items-center"
      >
        <Github className="h-5 w-5 mr-1" />
        GitHub
      </Link>
    </section>
  );
};
