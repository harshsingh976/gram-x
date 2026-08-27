using System;
using System.Collections;
using System.Text;
using UnityEngine;
using UnityEngine.Networking;

namespace GramX.DigitalTwin
{
    [Serializable]
    public class Vector3Data
    {
        public float x;
        public float y;
        public float z;
    }

    [Serializable]
    public class SceneNodeData
    {
        public string node_id;
        public int asset_id;
        public string asset_type;
        public string name;
        public Vector3Data position_3d;
        public Vector3Data rotation_3d;
        public Vector3Data scale_3d;
        public string status;
        public string status_color_hex;
        public float risk_score;
        public float health_index;
    }

    [Serializable]
    public class SpatialSceneResponse
    {
        public string scene_name;
        public int total_nodes;
        public int total_connectors;
        public SceneNodeData[] nodes;
        public string exported_at;
    }

    public class GramXApiClient : MonoBehaviour
    {
        [Header("Backend Connection")]
        public string backendBaseUrl = "http://127.0.0.1:8000/api";
        public string bearerToken = "";

        public static GramXApiClient Instance { get; private set; }

        private void Awake()
        {
            if (Instance == null) Instance = this;
            else Destroy(gameObject);
        }

        public void FetchSpatialScene(Action<SpatialSceneResponse> onSuccess, Action<string> onError)
        {
            StartCoroutine(FetchSpatialSceneRoutine(onSuccess, onError));
        }

        private IEnumerator FetchSpatialSceneRoutine(Action<SpatialSceneResponse> onSuccess, Action<string> onError)
        {
            string url = $"{backendBaseUrl}/digital-twin/spatial-scene";
            using (UnityWebRequest req = UnityWebRequest.Get(url))
            {
                if (!string.IsNullOrEmpty(bearerToken))
                {
                    req.SetRequestHeader("Authorization", $"Bearer {bearerToken}");
                }

                yield return req.SendWebRequest();

                if (req.result == UnityWebRequest.Result.Success)
                {
                    string json = req.downloadHandler.text;
                    SpatialSceneResponse scene = JsonUtility.FromJson<SpatialSceneResponse>(json);
                    onSuccess?.Invoke(scene);
                }
                else
                {
                    onError?.Invoke(req.error + " | " + req.downloadHandler.text);
                }
            }
        }
    }
}
