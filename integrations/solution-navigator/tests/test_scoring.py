import unittest
from solution_navigator.core.scoring import calculate_score, evaluate_alternative, rank_alternatives
from solution_navigator.core.models import Alternative, AlternativeCategory

class TestScoring(unittest.TestCase):
    def test_weights_sum_to_one(self):
        from solution_navigator.core.scoring import WEIGHTS
        self.assertAlmostEqual(sum(WEIGHTS.values()), 1.0, places=4)
        self.assertEqual(WEIGHTS["objective_compliance"], 0.30)
        self.assertEqual(WEIGHTS["technical_feasibility"], 0.25)
        self.assertEqual(WEIGHTS["implementation_risk"], 0.15)
        self.assertEqual(WEIGHTS["time_effort"], 0.10)
        self.assertEqual(WEIGHTS["operational_cost"], 0.10)
        self.assertEqual(WEIGHTS["maintainability"], 0.10)

    def test_perfect_score_calculation(self):
        vals = {
            "objective_compliance": 5.0,
            "technical_feasibility": 5.0,
            "implementation_risk": 5.0,
            "time_effort": 5.0,
            "operational_cost": 5.0,
            "maintainability": 5.0,
        }
        res = calculate_score(vals)
        self.assertEqual(res.weighted_total, 5.0)

    def test_clamping_and_weights(self):
        vals = {
            "objective_compliance": 10.0, # Debe acotarse a 5.0 -> 1.5
            "technical_feasibility": 0.0,  # Debe acotarse a 1.0 -> 0.25
            "implementation_risk": 3.0,   # 0.45
            "time_effort": 4.0,           # 0.40
            "operational_cost": 5.0,      # 0.50
            "maintainability": 2.0,       # 0.20
        }
        # Total esperado: 1.5 + 0.25 + 0.45 + 0.40 + 0.50 + 0.20 = 3.30
        res = calculate_score(vals)
        self.assertEqual(res.weighted_total, 3.30)

    def test_ranking_excludes_at_bottom(self):
        alt1 = Alternative(
            id="alt-1", title="Alt 1", category=AlternativeCategory.REPAIR,
            description="desc", estimated_cost="Bajo", effort="1h", confidence="DEMOSTRADA"
        )
        evaluate_alternative(alt1, {"objective_compliance": 4.0, "technical_feasibility": 4.0, "implementation_risk": 4.0, "time_effort": 4.0, "operational_cost": 4.0, "maintainability": 4.0})

        alt2 = Alternative(
            id="alt-2", title="Alt 2", category=AlternativeCategory.TECH_CHANGE,
            description="desc", estimated_cost="Alto", effort="10h", confidence="ESTIMADA",
            is_excluded=True, exclusion_reason="Incumple requisito"
        )
        evaluate_alternative(alt2, {"objective_compliance": 5.0, "technical_feasibility": 5.0, "implementation_risk": 5.0, "time_effort": 5.0, "operational_cost": 5.0, "maintainability": 5.0})

        ranked = rank_alternatives([alt2, alt1])
        self.assertEqual(ranked[0].id, "alt-1", "Las alternativas válidas deben figurar antes que las excluidas")
        self.assertTrue(ranked[1].is_excluded)

if __name__ == "__main__":
    unittest.main()
