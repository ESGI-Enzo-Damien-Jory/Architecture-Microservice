import { Button } from "@/components/ui/button";
import Image from "next/image";

export function Hero() {
  return (
    <section className="relative flex h-screen items-center justify-center bg-gradient-to-br from-yellow-200 via-red-100 to-yellow-50 overflow-hidden">
      {/* Burger slice animé */}
      <div className="absolute -top-16 animate-float-slow">
        <Image
          src="/images/burger-slice.png"
          alt="Burger Slice"
          width={200}
          height={200}
        />
      </div>
      <div className="absolute -bottom-16 animate-float-inverse">
        <Image
          src="/images/burger-slice.png"
          alt="Burger Slice"
          width={200}
          height={200}
        />
      </div>

      <div className="z-10 text-center px-4">
        <h1 className="text-5xl font-extrabold text-red-600 drop-shadow-md">
          Goûtez la différence
        </h1>
        <p className="mt-4 text-lg text-gray-700">
          Burgers artisanaux, frites croustillantes et desserts gourmands.
        </p>
        <Button size="lg" className="mt-8 bg-red-600 hover:bg-red-700">
          Commander Maintenant
        </Button>
      </div>
    </section>
  );
}
