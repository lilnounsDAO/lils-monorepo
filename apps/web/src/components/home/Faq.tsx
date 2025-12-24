import FaqAccordion from "@/components/FaqAccordion";
import { LinkExternal } from "@/components/ui/link";
import { ReactNode } from "react";

const NOUNDERS: { name: string; href: string }[] = [
  { name: "@0xsvg", href: "https://x.com/0xsvg" },
  { name: "@adelidusiam", href: "https://x.com/adelidusiam" },
  { name: "@dg_goens", href: "https://x.com/dg_goens" },
];

const QUESTIONS_AND_ANSWERS: { question: string; answer: ReactNode }[] = [
  {
    question: "What is a Lil Noun?",
    answer: (
      <>
        <p>
          A Lil Noun is a one-of-a-kind 32x32 pixel art character created daily
          as part of the Lil Nouns project. Each Lil Noun is randomly generated
          with traits:
        </p>
        <ul>
          <li>backgrounds</li>
          <li>heads</li>
          <li>glasses</li>
          <li>body</li>
          <li>accessory</li>
        </ul>
        <p>
          Each Lil Noun is stored on the Ethereum blockchain. This makes the
          artwork permanent forever. Beyond the art, owning a Lil Noun gives you
          membership in Lil Nouns DAO, a community that manages a shared
          treasury to fund creative and impactful projects.
        </p>
      </>
    ),
  },
  {
    question: "What is Lil Nouns DAO?",
    answer: (
      <>
        <p>
          Lil Nouns is a community-driven project that creates and funds
          creative ideas and public initiatives. Each day, a unique pixel art
          character called a "Lil Noun" is generated and sold through an
          auction. The funds raised go into a shared community treasury, managed
          collectively by Lil Noun holders. Owning a Lil Noun gives you a vote
          in deciding how the treasury is used.
        </p>
        <p>
          Since 2022, Lil Nouns has supported hundreds of impactful projects
          across arts, education, the environment, sports, and more. These
          include funding schools, providing artist grants, supporting clean
          water initiatives, creating public goods like open-source software,
          backing charity events, empowering underrepresented communities,
          producing educational resources, and sponsoring innovative cultural
          and environmental projects. Lil Nouns is committed to making a
          positive impact on the world.
        </p>
      </>
    ),
  },
  {
    question: "How do auctions work?",
    answer: (
      <>
        <p>
          Lil Nouns uses a VRGDA (Variable Rate Gradual Dutch Auction) system.
          New Lil Nouns are released at variable intervals. The auction price
          gradually decreases over time until someone purchases the Lil Noun.
          Once a purchase is made, the proceeds are sent directly to the Lil
          Nouns community treasury, and the next auction begins automatically.
          This cycle continues indefinitely. Anyone can participate in the auctions, and the funds raised are used
          to support creative and impactful projects decided by Lil Noun holders.
        </p>
      </>
    ),
  },
  {
    question: "Who can own a Lil Noun, and what does it mean?",
    answer: (
      <>
        <p>
          Anyone can own a Lil Noun by purchasing one from the Lil Nouns contract/website, or purchasing one from
          an existing owner. Owning a Lil Noun gives you membership in Lil Nouns DAO, a
          community where one Lil Noun equals one vote. This allows you to
          participate in decisions about how the community treasury is used to
          fund creative and impactful projects.
        </p>
      </>
    ),
  },
  {
    question: "Are Lil Nouns free to use?",
    answer: (
      <>
        <p>
          Yes, Lil Nouns are completely free to use. Their artwork is in the public
          domain, meaning anyone can use, modify, or build upon Lil Nouns without
          any restrictions or licenses. This openness encourages creativity and
          allows people to integrate Lil Nouns into their own projects or ideas.
        </p>
      </>
    ),
  },
  {
    question: "What kinds of projects does Lil Nouns fund?",
    answer: (
      <>
        <p>
          Lil Nouns funds creative projects that benefit the public and support
          subcultures. These include:
        </p>
        <ul>
          <li>
            <b>Art</b>: Public art, artist grants, and creative projects.
          </li>
          <li>
            <b>Education</b>: Schools, learning tools, and resources.
          </li>
          <li>
            <b>Environment</b>: Clean water and sustainability efforts.
          </li>
          <li>
            <b>Sports</b>: Community events and programs.
          </li>
          <li>
            <b>Technology</b>: Open-source tools and blockchain improvements.
          </li>
          <li>
            <b>Charity</b>: Supporting communities and social causes.
          </li>
          <li>and many more...</li>
        </ul>
        <p>
          By backing subcultures, Lil Nouns encourages creativity and
          innovation, helping unique ideas thrive.
        </p>
      </>
    ),
  },
  {
    question: "Who created Lil Nouns?",
    answer: (
      <>
        <p>
          The Lil Nounders are the creators of the Lil Nouns project. To reward
          their work in building and maintaining the ecosystem, every 10th Noun
          for the first five years (e.g., Noun IDs #0, #10, #20, and so on) is
          automatically sent to the Lil Nounders' wallet. This ensures they have
          a vested interest in the project's success while 100% of auction
          proceeds go directly to the Nouns DAO treasury.
        </p>
        <div>
          The Lil Nounders include:
          <ul>
            {NOUNDERS.map(({ name, href }, i) => (
              <li key={i}>
                <LinkExternal
                  href={href}
                  className="underline hover:text-semantic-accent hover:brightness-100"
                >
                  {name}
                </LinkExternal>
              </li>
            ))}
          </ul>
        </div>
        <p>
          Importantly, these distributions don't disrupt the auction cycle. Lil
          Nouns sent to the Lil Nounders' wallet are separate from the auction
          process, and auctions continue seamlessly with the next available Lil
          Noun ID.
        </p>
      </>
    ),
  },
];

export default function Faq() {
  return (
    <section
      className="flex w-full flex-col items-center justify-center gap-16 px-6 md:px-10"
      id="faq"
    >
      <div className="heading-1">Questions? Answers.</div>
      <FaqAccordion items={QUESTIONS_AND_ANSWERS} />
    </section>
  );
}
