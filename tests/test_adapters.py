import os
import unittest

from app.adapters.meterless import (
    MeterlessModel,
    MissingCredentials,
    _is_configured_nemotron,
)
from app.adapters.zetaris import ZetarisSource
from app.store import SampleSource, bind_params, load_queries


class AdapterTests(unittest.TestCase):
    def test_zetaris_sql_matches_sample_bind(self):
        source = SampleSource()
        zetaris = ZetarisSource()
        scenario_id = "scn-block"
        for name in ("reports", "positions"):
            expected = bind_params(load_queries()[name], scenario_id)
            self.assertEqual(zetaris.sql(name, scenario_id), expected)
            self.assertEqual(
                zetaris.sql(name, scenario_id),
                bind_params(source.queries[name], scenario_id),
            )

    def test_meterless_placeholder_key_raises(self):
        keys = (
            "METERLESS_BASE_URL",
            "METERLESS_API_KEY",
            "NEMOTRON_SUPER",
        )
        saved = {key: os.environ.get(key) for key in keys}
        try:
            os.environ["METERLESS_BASE_URL"] = "https://example.test"
            os.environ["METERLESS_API_KEY"] = "tu_api_key_aqui"
            os.environ["NEMOTRON_SUPER"] = "nemotron-test"
            with self.assertRaises(MissingCredentials):
                MeterlessModel()
        finally:
            for key, value in saved.items():
                if value is None:
                    os.environ.pop(key, None)
                else:
                    os.environ[key] = value


    def test_alias_may_report_underlying_nemotron(self):
        allowed = {"meterless/auto", "meterless/fast", "meterless/deep"}
        self.assertTrue(
            _is_configured_nemotron("nvidia/nemotron-3-ultra-550b-a55b", allowed)
        )
        self.assertFalse(
            _is_configured_nemotron("local-runtime/qwen2.5-14b-instruct", allowed)
        )


if __name__ == "__main__":
    unittest.main()
