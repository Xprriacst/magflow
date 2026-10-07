import importlib.util
import os
from pathlib import Path
import tempfile
import unittest


APP_DIR = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("magflow_flask_app", APP_DIR / "app.py")
magflow = importlib.util.module_from_spec(SPEC)
os.environ["API_TOKEN"] = "test-token"
SPEC.loader.exec_module(magflow)


class OutputPathTest(unittest.TestCase):
    def test_download_uses_configured_output_folder(self):
        with tempfile.TemporaryDirectory() as tmp_dir:
            magflow.app.config["OUTPUT_FOLDER"] = tmp_dir
            project_id = "projet-test"
            expected = Path(tmp_dir) / f"{project_id}.indd"
            expected.write_bytes(b"indesign")

            response = magflow.app.test_client().get(
                f"/api/download/{project_id}",
                headers={"Authorization": "Bearer test-token"},
            )

            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.data, b"indesign")
            response.close()

    def test_jsx_uses_output_path_from_json(self):
        jsx = (APP_DIR / "scripts" / "template_simple_working.jsx").read_text()


        self.assertIn("new File(config.output_path)", jsx)
        self.assertNotIn("new Folder(configFile.parent)", jsx)


if __name__ == "__main__":
    unittest.main()
