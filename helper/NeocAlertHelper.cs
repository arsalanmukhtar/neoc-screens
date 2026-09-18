// NEOC Alert Helper
// A small Windows tray program for the operator PCs. When a desktop alert reaches this PC's
// browser (the NEOC dashboard), the browser hands it to this helper on 127.0.0.1:47800 and
// the helper covers every screen with a flashing, always-on-top alert until Acknowledge.
//
// Build: helper\build.cmd (uses the C# compiler that ships with Windows / .NET Framework 4.x)
// Nothing here talks to the internet; it only listens on the local loopback address.

using System;
using System.Collections.Generic;
using System.Drawing;
using System.IO;
using System.Media;
using System.Net;
using System.Net.Sockets;
using System.Reflection;
using System.Text;
using System.Threading;
using System.Web.Script.Serialization;
using System.Windows.Forms;
using Microsoft.Win32;

[assembly: AssemblyTitle("NEOC Alert Helper")]
[assembly: AssemblyProduct("NEOC Tech (EW) Control Dashboard")]
[assembly: AssemblyDescription("Shows NEOC desktop alerts full-screen, on top of all windows")]
[assembly: AssemblyVersion("1.0.0.0")]
[assembly: AssemblyFileVersion("1.0.0.0")]

namespace NeocAlertHelper
{
    static class Program
    {
        public const int Port = 47800;
        public const string Version = "1.0";

        [STAThread]
        static void Main()
        {
            bool created;
            using (var mutex = new Mutex(true, "NEOC.AlertHelper.SingleInstance", out created))
            {
                if (!created)
                {
                    MessageBox.Show("NEOC Alert Helper is already running.\nLook for its icon in the system tray.",
                        "NEOC Alert Helper", MessageBoxButtons.OK, MessageBoxIcon.Information);
                    return;
                }
                Application.EnableVisualStyles();
                Application.SetCompatibleTextRenderingDefault(false);
                Application.Run(new HelperContext());
            }
        }
    }

    public class AlertMessage
    {
        public string Title;
        public string Body;
        public string StationId;
        public string At;
    }

    // ── Tray icon, autostart and alert windows ──────────────────────────────────
    class HelperContext : ApplicationContext
    {
        const string RunKey = @"Software\Microsoft\Windows\CurrentVersion\Run";
        const string RunName = "NEOC Alert Helper";
        const string PrefKey = @"Software\NEOC\AlertHelper";

        readonly NotifyIcon tray;
        readonly ToolStripMenuItem autostartItem;
        readonly SynchronizationContext ui;
        readonly AlertServer server;
        readonly Dictionary<string, DateTime> seen = new Dictionary<string, DateTime>();
        readonly List<AlertForm> openForms = new List<AlertForm>();
        int alertCount;

        public HelperContext()
        {
            ui = new WindowsFormsSynchronizationContext();
            SynchronizationContext.SetSynchronizationContext(ui);

            var menu = new ContextMenuStrip();
            var header = new ToolStripMenuItem("NEOC Alert Helper " + Program.Version + " — listening");
            header.Enabled = false;
            menu.Items.Add(header);
            menu.Items.Add(new ToolStripSeparator());
            menu.Items.Add("Show a test alert", null, delegate { ShowAlert(TestAlert()); });
            autostartItem = new ToolStripMenuItem("Start with Windows", null, delegate { ToggleAutostart(); });
            menu.Items.Add(autostartItem);
            menu.Items.Add(new ToolStripSeparator());
            menu.Items.Add("Exit", null, delegate { ExitHelper(); });

            tray = new NotifyIcon();
            tray.Icon = LoadIcon();
            tray.Text = "NEOC Alert Helper — waiting for alerts";
            tray.ContextMenuStrip = menu;
            tray.Visible = true;
            tray.DoubleClick += delegate { ShowAlert(TestAlert()); };

            EnsureAutostartDefault();
            autostartItem.Checked = IsAutostartOn();

            server = new AlertServer(Program.Port, OnAlertFromServer);
            string error;
            if (!server.Start(out error))
            {
                MessageBox.Show("NEOC Alert Helper could not start listening on port " + Program.Port + ".\n\n" + error,
                    "NEOC Alert Helper", MessageBoxButtons.OK, MessageBoxIcon.Error);
                tray.Visible = false;
                Environment.Exit(1);
            }

            tray.ShowBalloonTip(4000, "NEOC Alert Helper is running",
                "Alerts for this PC will appear full-screen. Right-click the tray icon for options.", ToolTipIcon.Info);
        }

        static Icon LoadIcon()
        {
            try { return Icon.ExtractAssociatedIcon(Application.ExecutablePath); }
            catch { return SystemIcons.Warning; }
        }

        static AlertMessage TestAlert()
        {
            var a = new AlertMessage();
            a.Title = "NEOC alert · TEST";
            a.Body = "This is a test. Alerts for this PC will look like this. Click Acknowledge to close it.";
            a.At = DateTime.Now.ToString("o");
            return a;
        }

        void OnAlertFromServer(AlertMessage alert)
        {
            ui.Post(delegate { ShowAlert(alert); }, null);
        }

        void ShowAlert(AlertMessage alert)
        {
            // The browser may deliver the same alert twice (service worker + page): ignore repeats
            string key = (alert.StationId ?? "") + "|" + (alert.At ?? "");
            if (!string.IsNullOrEmpty(alert.At))
            {
                DateTime when;
                if (seen.TryGetValue(key, out when) && (DateTime.Now - when).TotalSeconds < 120) return;
                seen[key] = DateTime.Now;
            }

            alertCount = openForms.Count > 0 ? alertCount + 1 : 1;
            if (openForms.Count > 0)
            {
                foreach (var f in openForms) f.SetAlert(alert, alertCount);
                openForms[0].Activate();
                return;
            }
            foreach (var screen in Screen.AllScreens)
            {
                var form = new AlertForm(screen, alert, alertCount);
                form.Acknowledged += AcknowledgeAll;
                openForms.Add(form);
                form.Show();
            }
            if (openForms.Count > 0) openForms[0].Activate();
            tray.Text = "NEOC Alert Helper — ALERT";
        }

        void AcknowledgeAll()
        {
            var forms = openForms.ToArray();
            openForms.Clear();
            alertCount = 0;
            foreach (var f in forms) f.CloseAcknowledged();
            tray.Text = "NEOC Alert Helper — waiting for alerts";
        }

        void ExitHelper()
        {
            server.Stop();
            tray.Visible = false;
            tray.Dispose();
            ExitThread();
        }

        // Autostart: on by default the first time, then whatever the operator chooses
        static void EnsureAutostartDefault()
        {
            try
            {
                using (var pref = Registry.CurrentUser.CreateSubKey(PrefKey))
                {
                    if (pref.GetValue("AutostartChosen") == null)
                    {
                        SetAutostart(true);
                        pref.SetValue("AutostartChosen", 1);
                    }
                    else if (IsAutostartOn())
                    {
                        SetAutostart(true);   // keep the path current if the exe was moved
                    }
                }
            }
            catch { }
        }

        static bool IsAutostartOn()
        {
            try
            {
                using (var run = Registry.CurrentUser.OpenSubKey(RunKey))
                    return run != null && run.GetValue(RunName) != null;
            }
            catch { return false; }
        }

        static void SetAutostart(bool on)
        {
            using (var run = Registry.CurrentUser.CreateSubKey(RunKey))
            {
                if (on) run.SetValue(RunName, "\"" + Application.ExecutablePath + "\"");
                else if (run.GetValue(RunName) != null) run.DeleteValue(RunName);
            }
        }

        void ToggleAutostart()
        {
            try
            {
                SetAutostart(!IsAutostartOn());
                using (var pref = Registry.CurrentUser.CreateSubKey(PrefKey)) pref.SetValue("AutostartChosen", 1);
            }
            catch (Exception ex)
            {
                MessageBox.Show("Could not change the startup setting.\n\n" + ex.Message, "NEOC Alert Helper");
            }
            autostartItem.Checked = IsAutostartOn();
        }
    }

    // ── Full-screen, always-on-top, flashing alert (one per monitor) ─────────────
    class AlertForm : Form
    {
        public event Action Acknowledged;

        static readonly Color Dark = Color.FromArgb(0x7F, 0x1D, 0x1D);
        static readonly Color Bright = Color.FromArgb(0xDC, 0x26, 0x26);

        readonly Label titleLabel = new Label();
        readonly Label bodyLabel = new Label();
        readonly Label timeLabel = new Label();
        readonly Button ackButton = new Button();
        readonly System.Windows.Forms.Timer pulse = new System.Windows.Forms.Timer();
        readonly System.Windows.Forms.Timer sound = new System.Windows.Forms.Timer();
        readonly System.Windows.Forms.Timer keepOnTop = new System.Windows.Forms.Timer();
        readonly DateTime started = DateTime.Now;
        bool acknowledged;

        public AlertForm(Screen screen, AlertMessage alert, int count)
        {
            Text = "NEOC alert";
            FormBorderStyle = FormBorderStyle.None;
            StartPosition = FormStartPosition.Manual;
            Bounds = screen.Bounds;
            TopMost = true;
            ShowInTaskbar = true;
            BackColor = Dark;
            KeyPreview = true;
            DoubleBuffered = true;
            try { Icon = Icon.ExtractAssociatedIcon(Application.ExecutablePath); } catch { }

            titleLabel.ForeColor = Color.White;
            titleLabel.Font = new Font("Segoe UI", 44f, FontStyle.Bold);
            titleLabel.TextAlign = ContentAlignment.MiddleCenter;
            titleLabel.BackColor = Color.Transparent;

            bodyLabel.ForeColor = Color.White;
            bodyLabel.Font = new Font("Segoe UI", 24f, FontStyle.Regular);
            bodyLabel.TextAlign = ContentAlignment.TopCenter;
            bodyLabel.BackColor = Color.Transparent;

            timeLabel.ForeColor = Color.FromArgb(0xFE, 0xCA, 0xCA);
            timeLabel.Font = new Font("Segoe UI", 14f, FontStyle.Regular);
            timeLabel.TextAlign = ContentAlignment.MiddleCenter;
            timeLabel.BackColor = Color.Transparent;

            ackButton.Text = "Acknowledge";
            ackButton.Font = new Font("Segoe UI", 22f, FontStyle.Bold);
            ackButton.ForeColor = Bright;
            ackButton.BackColor = Color.White;
            ackButton.FlatStyle = FlatStyle.Flat;
            ackButton.FlatAppearance.BorderSize = 0;
            ackButton.Cursor = Cursors.Hand;
            ackButton.Click += delegate { Acknowledge(); };

            Controls.Add(titleLabel);
            Controls.Add(bodyLabel);
            Controls.Add(timeLabel);
            Controls.Add(ackButton);
            AcceptButton = ackButton;

            SetAlert(alert, count);

            // Slow pulse between dark and bright red (under 1 flash per second)
            pulse.Interval = 50;
            pulse.Tick += delegate
            {
                double t = (DateTime.Now - started).TotalSeconds;
                double k = (Math.Sin(t * Math.PI * 2 / 1.6) + 1) / 2;
                BackColor = Color.FromArgb(
                    (int)(Dark.R + (Bright.R - Dark.R) * k),
                    (int)(Dark.G + (Bright.G - Dark.G) * k),
                    (int)(Dark.B + (Bright.B - Dark.B) * k));
            };

            // Repeat a warning sound until acknowledged
            sound.Interval = 4000;
            sound.Tick += delegate { SystemSounds.Hand.Play(); };

            // Some programs push themselves on top; take the top spot back
            keepOnTop.Interval = 2000;
            keepOnTop.Tick += delegate { TopMost = false; TopMost = true; };

            Layout += delegate { LayoutControls(); };
            Shown += delegate
            {
                LayoutControls();
                Activate();
                ackButton.Focus();
                SystemSounds.Hand.Play();
                pulse.Start();
                sound.Start();
                keepOnTop.Start();
            };
        }

        public void SetAlert(AlertMessage alert, int count)
        {
            titleLabel.Text = string.IsNullOrEmpty(alert.Title) ? "NEOC alert" : alert.Title;
            bodyLabel.Text = alert.Body ?? "";
            DateTime when;
            if (!DateTime.TryParse(alert.At, out when)) when = DateTime.Now;
            timeLabel.Text = "Received " + when.ToLocalTime().ToString("HH:mm:ss") + (count > 1 ? "  ·  " + count + " alerts" : "");
            LayoutControls();
        }

        void LayoutControls()
        {
            int w = ClientSize.Width, h = ClientSize.Height;
            int width = Math.Min(w - 80, 1200);
            int x = (w - width) / 2;
            int y = h / 2 - 190;
            titleLabel.SetBounds(x, y, width, 90);
            bodyLabel.SetBounds(x, y + 110, width, 150);
            timeLabel.SetBounds(x, y + 270, width, 32);
            ackButton.SetBounds((w - 320) / 2, y + 330, 320, 76);
        }

        void Acknowledge()
        {
            if (Acknowledged != null) Acknowledged();
        }

        public void CloseAcknowledged()
        {
            acknowledged = true;
            pulse.Stop();
            sound.Stop();
            keepOnTop.Stop();
            Close();
        }

        protected override void OnFormClosing(FormClosingEventArgs e)
        {
            // Alt+F4 and friends don't dismiss the alert — only Acknowledge does
            if (!acknowledged && e.CloseReason == CloseReason.UserClosing) e.Cancel = true;
            base.OnFormClosing(e);
        }
    }

    // ── Minimal local HTTP endpoint on 127.0.0.1 (no admin rights needed) ────────
    class AlertServer
    {
        readonly int port;
        readonly Action<AlertMessage> onAlert;
        TcpListener listener;
        Thread thread;
        volatile bool running;

        public AlertServer(int port, Action<AlertMessage> onAlert)
        {
            this.port = port;
            this.onAlert = onAlert;
        }

        public bool Start(out string error)
        {
            error = null;
            try
            {
                listener = new TcpListener(IPAddress.Loopback, port);
                listener.Start();
            }
            catch (Exception ex)
            {
                error = ex.Message;
                return false;
            }
            running = true;
            thread = new Thread(AcceptLoop);
            thread.IsBackground = true;
            thread.Start();
            return true;
        }

        public void Stop()
        {
            running = false;
            try { listener.Stop(); } catch { }
        }

        void AcceptLoop()
        {
            while (running)
            {
                try
                {
                    var client = listener.AcceptTcpClient();
                    ThreadPool.QueueUserWorkItem(delegate { Handle(client); });
                }
                catch { if (!running) return; }
            }
        }

        // The dashboard (and local testing) may call; other websites may not
        static bool OriginAllowed(string origin)
        {
            if (string.IsNullOrEmpty(origin)) return true;   // not from a web page
            if (origin == "https://neoc-screens.vercel.app") return true;
            return origin.StartsWith("http://localhost:") || origin.StartsWith("http://127.0.0.1:");
        }

        void Handle(TcpClient client)
        {
            using (client)
            {
                try
                {
                    client.ReceiveTimeout = 5000;
                    client.SendTimeout = 5000;
                    var stream = client.GetStream();

                    // Read headers
                    var buffer = new List<byte>();
                    int headerEnd = -1;
                    var chunk = new byte[1024];
                    while (headerEnd < 0 && buffer.Count < 16384)
                    {
                        int n = stream.Read(chunk, 0, chunk.Length);
                        if (n <= 0) return;
                        for (int i = 0; i < n; i++) buffer.Add(chunk[i]);
                        headerEnd = IndexOf(buffer, new byte[] { 13, 10, 13, 10 });
                    }
                    if (headerEnd < 0) return;

                    var all = buffer.ToArray();
                    string head = Encoding.ASCII.GetString(all, 0, headerEnd);
                    var lines = head.Split(new[] { "\r\n" }, StringSplitOptions.None);
                    var parts = lines[0].Split(' ');
                    if (parts.Length < 2) return;
                    string method = parts[0].ToUpperInvariant();
                    string path = parts[1].Split('?')[0];

                    var headers = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
                    for (int i = 1; i < lines.Length; i++)
                    {
                        int c = lines[i].IndexOf(':');
                        if (c > 0) headers[lines[i].Substring(0, c).Trim()] = lines[i].Substring(c + 1).Trim();
                    }
                    string origin;
                    headers.TryGetValue("Origin", out origin);
                    if (!OriginAllowed(origin))
                    {
                        Respond(stream, 403, "Forbidden", "{\"error\":\"origin not allowed\"}", null);
                        return;
                    }

                    // Read body
                    int length = 0;
                    string cl;
                    if (headers.TryGetValue("Content-Length", out cl)) int.TryParse(cl, out length);
                    length = Math.Min(Math.Max(length, 0), 16384);
                    var body = new List<byte>();
                    for (int i = headerEnd + 4; i < all.Length; i++) body.Add(all[i]);
                    while (body.Count < length)
                    {
                        int n = stream.Read(chunk, 0, Math.Min(chunk.Length, length - body.Count));
                        if (n <= 0) break;
                        for (int i = 0; i < n; i++) body.Add(chunk[i]);
                    }

                    if (method == "OPTIONS")
                    {
                        Respond(stream, 204, "No Content", "", origin);
                    }
                    else if (method == "GET" && path == "/ping")
                    {
                        Respond(stream, 200, "OK", "{\"ok\":true,\"app\":\"NEOC Alert Helper\",\"version\":\"" + Program.Version + "\"}", origin);
                    }
                    else if (method == "POST" && path == "/alert")
                    {
                        Dictionary<string, object> json = null;
                        try { json = new JavaScriptSerializer().DeserializeObject(Encoding.UTF8.GetString(body.ToArray())) as Dictionary<string, object>; }
                        catch { }
                        if (json == null)
                        {
                            Respond(stream, 400, "Bad Request", "{\"error\":\"invalid JSON\"}", origin);
                            return;
                        }
                        var alert = new AlertMessage();
                        alert.Title = Str(json, "title", 120);
                        alert.Body = Str(json, "body", 400);
                        alert.StationId = Str(json, "stationId", 20);
                        alert.At = Str(json, "at", 40);
                        onAlert(alert);
                        Respond(stream, 200, "OK", "{\"ok\":true}", origin);
                    }
                    else
                    {
                        Respond(stream, 404, "Not Found", "{\"error\":\"not found\"}", origin);
                    }
                }
                catch { }
            }
        }

        static string Str(Dictionary<string, object> json, string key, int max)
        {
            object v;
            if (!json.TryGetValue(key, out v) || v == null) return "";
            string s = v.ToString();
            return s.Length > max ? s.Substring(0, max) : s;
        }

        static int IndexOf(List<byte> data, byte[] pattern)
        {
            for (int i = 0; i + pattern.Length <= data.Count; i++)
            {
                bool match = true;
                for (int j = 0; j < pattern.Length; j++)
                    if (data[i + j] != pattern[j]) { match = false; break; }
                if (match) return i;
            }
            return -1;
        }

        static void Respond(NetworkStream stream, int code, string reason, string body, string origin)
        {
            var sb = new StringBuilder();
            sb.Append("HTTP/1.1 ").Append(code).Append(' ').Append(reason).Append("\r\n");
            sb.Append("Content-Type: application/json; charset=utf-8\r\n");
            if (!string.IsNullOrEmpty(origin))
            {
                sb.Append("Access-Control-Allow-Origin: ").Append(origin).Append("\r\n");
                sb.Append("Vary: Origin\r\n");
                sb.Append("Access-Control-Allow-Methods: GET, POST, OPTIONS\r\n");
                sb.Append("Access-Control-Allow-Headers: Content-Type\r\n");
                sb.Append("Access-Control-Allow-Private-Network: true\r\n");
                sb.Append("Access-Control-Max-Age: 600\r\n");
            }
            byte[] payload = Encoding.UTF8.GetBytes(body);
            sb.Append("Content-Length: ").Append(payload.Length).Append("\r\n");
            sb.Append("Connection: close\r\n\r\n");
            byte[] headerBytes = Encoding.ASCII.GetBytes(sb.ToString());
            stream.Write(headerBytes, 0, headerBytes.Length);
            if (payload.Length > 0) stream.Write(payload, 0, payload.Length);
            stream.Flush();
        }
    }
}
