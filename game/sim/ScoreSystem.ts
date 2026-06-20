// Datak — score book + winner detection.

import { MATCH } from "@/lib/constants";
import type { ScoreState, Team } from "@/types/game";

export class ScoreSystem {
  state: ScoreState = { A: 0, B: 0 };

  award(team: Team, bonus: boolean) {
    this.state[team] += bonus ? MATCH.HIT_BONUS : MATCH.HIT_REGULAR;
    if (this.state.A >= MATCH.SCORE_TO_WIN && this.state.A > this.state.B) {
      this.state.winner = "A";
    } else if (
      this.state.B >= MATCH.SCORE_TO_WIN &&
      this.state.B > this.state.A
    ) {
      this.state.winner = "B";
    }
  }

  isOver() {
    return !!this.state.winner;
  }

  reset() {
    this.state = { A: 0, B: 0 };
  }
}
