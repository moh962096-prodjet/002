import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase.js";

export function useLeaderboard(game) {
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("high_scores")
      .select("player_name, score, created_at")
      .eq("game", game)
      .order("score", { ascending: false })
      .limit(8);
    if (!error) setScores(data || []);
    setLoading(false);
  }, [game]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const submit = useCallback(
    async (playerName, score) => {
      if (!playerName || score == null) return;
      await supabase
        .from("high_scores")
        .insert({ player_name: playerName, game, score });
      refresh();
    },
    [game, refresh]
  );

  return { scores, loading, submit, refresh };
}
