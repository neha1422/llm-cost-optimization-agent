import { ChevronDown, ArrowUpRight } from "lucide-react";
/** Secondary engineering views stay available without interrupting the demo. */
export function EngineeringMenu() {
  return (
    <details className="engineering-menu">
      <summary>
        Engineering details <ChevronDown size={14} />
      </summary>
      <div>
        <p>Optional tools for technical reviewers</p>
        <a href="/workspace?view=Pipeline">
          Step-by-step execution data <ArrowUpRight size={13} />
        </a>
        <a href="/compare?details=1">
          Full prompts & before/after traces <ArrowUpRight size={13} />
        </a>
        <a href="/workspace?view=Cost%20analytics">
          Detailed cost charts <ArrowUpRight size={13} />
        </a>
        <a href="/workspace?view=Knowledge%20base">
          Browse support policies <ArrowUpRight size={13} />
        </a>
        <a href="/workspace?view=Benchmarks">
          Tests & benchmarks <ArrowUpRight size={13} />
        </a>
        <a href="/workspace?view=Architecture">
          System architecture <ArrowUpRight size={13} />
        </a>
        <a href="/lab">
          Advanced experiments <ArrowUpRight size={13} />
        </a>
      </div>
    </details>
  );
}
