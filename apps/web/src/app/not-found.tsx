import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex grow flex-col items-center justify-center gap-2 p-4">
      <h2>404 - Not Found</h2>
      <p>Could not find requested resource</p>
      <Link to="/">
        <Button>Return Home</Button>
      </Link>
    </div>
  );
}
