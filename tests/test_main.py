import importlib.util
import sys
import types
import unittest
from pathlib import Path
from urllib.error import URLError


def load_plugin_module():
    module_name = "sdhq_plugin_main_test"
    module_path = Path(__file__).resolve().parents[1] / "main.py"
    spec = importlib.util.spec_from_file_location(module_name, module_path)
    module = importlib.util.module_from_spec(spec)
    sys.modules["decky"] = types.SimpleNamespace(
        logger=types.SimpleNamespace(info=lambda *args, **kwargs: None, error=lambda *args, **kwargs: None)
    )
    assert spec is not None
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


class PluginRequestErrorTests(unittest.IsolatedAsyncioTestCase):
    async def test_get_news_records_request_errors(self):
        module = load_plugin_module()
        plugin = module.Plugin()

        def failing_request_json(url: str):
            raise URLError("dns down")

        original_request_json = module._request_json
        module._request_json = failing_request_json
        try:
            self.assertEqual(await plugin.get_news(), [])
            errors = await plugin.get_last_request_errors()
        finally:
            module._request_json = original_request_json

        self.assertIn("news", errors)
        self.assertIn("URLError", errors["news"])

    async def test_success_clears_previous_request_errors(self):
        module = load_plugin_module()
        plugin = module.Plugin()

        def failing_request_json(url: str):
            raise URLError("dns down")

        def successful_request_json(url: str):
            return [{"id": 1}]

        original_request_json = module._request_json
        try:
            module._request_json = failing_request_json
            self.assertEqual(await plugin.get_news(), [])

            module._request_json = successful_request_json
            self.assertEqual(await plugin.get_news(), [{"id": 1}])
            errors = await plugin.get_last_request_errors()
        finally:
            module._request_json = original_request_json

        self.assertNotIn("news", errors)


if __name__ == "__main__":
    unittest.main()
