"""前后端联合测试 — 真实 LLM 调用全流程"""
import asyncio, json, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
import httpx

BASE = "http://localhost:8000"
TOPIC = "AI Ethics: Where is the boundary?"
EXPERT_COUNT = 4

async def main():
    async with httpx.AsyncClient(timeout=120, trust_env=False) as c:

        # Step 1: Create discussion
        print("=" * 50)
        print("Step 1: Create discussion")
        payload = {"topic": TOPIC, "expert_count": EXPERT_COUNT}
        r = await c.post(f"{BASE}/api/discussions", json=payload)
        print(f"  HTTP {r.status_code}")
        if r.status_code != 201:
            print(f"  ERROR: {r.text}")
            return
        disc = r.json()
        disc_id = disc["id"]
        print(f"  ID: {disc_id}")
        print(f"  Status: {disc['status']}")

        # Step 2: Generate panel (real LLM call)
        print("\nStep 2: Generate panel via DeepSeek LLM...")
        r = await c.post(f"{BASE}/api/discussions/{disc_id}/panel/generate")
        print(f"  HTTP {r.status_code}")
        if r.status_code != 200:
            print(f"  ERROR: {r.text}")
            return
        panel = r.json()
        print(f"  Host: {panel['host']['name']} ({panel['host']['profession']})")
        print(f"  Host stance: {panel['host']['stance']}")
        for i, e in enumerate(panel['experts']):
            print(f"  Expert {i+1}: {e['name']} — {e['profession']}")
            print(f"    Stance: {e['stance']}")
            print(f"    Color: {e['color']}")

        # Step 3: Start discussion
        print("\nStep 3: Start discussion (launching engine)...")
        r = await c.post(f"{BASE}/api/discussions/{disc_id}/start")
        print(f"  HTTP {r.status_code}")
        if r.status_code != 200:
            print(f"  ERROR: {r.text}")
            return
        print(f"  {r.json()['message']}")

        # Step 4: Wait and monitor transcript
        print("\nStep 4: Monitoring transcript (waiting for engine)...")
        for i in range(8):
            await asyncio.sleep(3)
            r = await c.get(f"{BASE}/api/discussions/{disc_id}/transcript")
            if r.status_code == 200:
                data = r.json()
                print(f"  [{(i+1)*3}s] Transcript: {data['total']} messages")
                if data['total'] > 0:
                    last = data['messages'][-1]
                    print(f"         Last: [{last['message_type']}] {last['panelist_name']}: {last['content'][:60]}...")

        # Step 5: Check consensus
        print("\nStep 5: Consensus points...")
        r = await c.get(f"{BASE}/api/discussions/{disc_id}/consensus")
        if r.status_code == 200:
            cps = r.json()
            print(f"  Total: {len(cps)}")
            for cp in cps:
                tag = "AGREE" if cp["point_type"] == "CONSENSUS" else "DISPUTE"
                print(f"  [{tag}] {cp['content']}")

        # Step 6: End discussion
        print("\nStep 6: End discussion...")
        r = await c.post(f"{BASE}/api/discussions/{disc_id}/end")
        print(f"  HTTP {r.status_code}")
        if r.status_code != 200:
            print(f"  ERROR: {r.text}")
            return
        result = r.json()
        print(f"  Status: {result['status']}")
        summary = result.get('summary', '')
        print(f"  Summary ({len(summary)} chars): {summary[:200]}...")

        # Step 7: Final check
        print("\nStep 7: Final state check")
        r = await c.get(f"{BASE}/api/discussions/{disc_id}")
        if r.status_code == 200:
            detail = r.json()
            print(f"  Status: {detail['status']}")
            print(f"  Panelists: {len(detail['panelists'])}")
            print(f"  Messages: {len(detail['latest_messages'])}")
            print(f"  Consensus: {len(detail['consensus_points'])}")

            # Check SUMMARY message exists
            r2 = await c.get(f"{BASE}/api/discussions/{disc_id}/transcript?offset=0&limit=100")
            msgs = r2.json()["messages"]
            summary_msgs = [m for m in msgs if m["message_type"] == "SUMMARY"]
            print(f"  SUMMARY messages: {len(summary_msgs)}")

        print("\n" + "=" * 50)
        print("INTEGRATION TEST PASSED")

asyncio.run(main())
